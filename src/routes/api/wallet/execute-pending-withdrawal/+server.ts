import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { supabase } from "$lib/supabase";
import { monimeService } from "$lib/monime";

export const POST: RequestHandler = async ({ request, fetch: eventFetch }) => {
  try {
    const { withdrawal_id } = await request.json();

    if (!withdrawal_id) {
      return json(
        { success: false, message: "Withdrawal ID is required." },
        { status: 400 }
      );
    }

    // Fetch the pending withdrawal
    const { data: withdrawal, error: fetchError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("id", withdrawal_id)
      .eq("status", "pending_approval")
      .eq("multisig_enabled", true)
      .single();

    if (fetchError || !withdrawal) {
      return json(
        {
          success: false,
          message:
            "Pending withdrawal not found or not eligible for execution.",
        },
        { status: 404 }
      );
    }

    // Verify if signature threshold is met
    if (
      withdrawal.collected_signatures.length < withdrawal.required_signatures
    ) {
      return json(
        { success: false, message: "Signature threshold not met yet." },
        { status: 403 }
      );
    }

    // Extract withdrawal details from metadata
    const metadata = withdrawal.metadata || {};
    const provider = metadata.provider || "orange_money";
    const phoneNumber = metadata.phone_number;
    // Parse netAmountAfterPlatformFee - it might be a string from metadata
    const netAmountAfterPlatformFee =
      typeof metadata.net_amount_after_platform_fee === "string"
        ? parseFloat(metadata.net_amount_after_platform_fee)
        : metadata.net_amount_after_platform_fee || Math.abs(withdrawal.amount);
    const currency = withdrawal.currency || "NLe";

    if (!phoneNumber) {
      return json(
        {
          success: false,
          message: "Phone number missing from withdrawal metadata",
        },
        { status: 400 }
      );
    }

    // Convert currency from "NLe" to "SLE" for Monime API (Monime uses ISO currency codes)
    const monimeCurrency = currency === "NLe" ? "SLE" : currency;

    // Map provider to Monime provider code
    const providerCode = provider === "orange_money" ? "m17" : "m18";

    // Convert metadata numeric values to strings for Monime API
    const monimeMetadata: Record<string, string> = {
      wallet_address: withdrawal.wallet_address,
      withdrawal_type: "mobile_money",
      multisig_withdrawal_id: String(withdrawal_id),
    };

    // Convert numeric metadata fields to strings
    if (metadata.gross_amount !== undefined) {
      monimeMetadata.gross_amount =
        typeof metadata.gross_amount === "string"
          ? metadata.gross_amount
          : String(Number(metadata.gross_amount).toFixed(2));
    }
    if (metadata.platform_fee !== undefined) {
      monimeMetadata.platform_fee =
        typeof metadata.platform_fee === "string"
          ? metadata.platform_fee
          : String(Number(metadata.platform_fee).toFixed(2));
    }
    if (metadata.estimated_monime_fee !== undefined) {
      monimeMetadata.estimated_monime_fee =
        typeof metadata.estimated_monime_fee === "string"
          ? metadata.estimated_monime_fee
          : String(Number(metadata.estimated_monime_fee).toFixed(2));
    }
    if (metadata.net_amount_after_platform_fee !== undefined) {
      monimeMetadata.net_amount_after_platform_fee =
        typeof metadata.net_amount_after_platform_fee === "string"
          ? metadata.net_amount_after_platform_fee
          : String(Number(metadata.net_amount_after_platform_fee).toFixed(2));
    }
    if (metadata.final_net_amount !== undefined) {
      monimeMetadata.final_net_amount =
        typeof metadata.final_net_amount === "string"
          ? metadata.final_net_amount
          : String(Number(metadata.final_net_amount).toFixed(2));
    }
    if (metadata.user_id !== undefined) {
      monimeMetadata.user_id = String(metadata.user_id);
    }

    // Execute payout via Monime API
    // Use event.fetch for relative URLs in server-side routes
    const payout = await monimeService.createPayout(
      {
        currency: monimeCurrency,
        value: netAmountAfterPlatformFee,
      },
      {
        providerCode: providerCode,
        accountId: phoneNumber,
      },
      undefined, // source (optional)
      monimeMetadata,
      `multisig_withdrawal_${withdrawal_id}_${Date.now()}`,
      eventFetch // Pass event.fetch for server-side relative URL support
    );

    // Calculate actual Monime fees
    const monimeFees =
      payout.fees?.reduce((sum: number, fee: any) => {
        const feeValue =
          typeof fee.amount?.value === "number"
            ? fee.amount.value / 100
            : parseFloat(fee.amount?.value || 0) / 100;
        return sum + feeValue;
      }, 0) || 0;

    // Check Monime payout status after a short delay to see if it completed
    // Monime payouts can complete asynchronously, so we check the actual status
    let finalPayoutStatus = payout.status;
    let finalPayout = payout;

    // If status is "pending", wait a moment and check again (Monime might complete it quickly)
    if (payout.status === "pending" || payout.status === "processing") {
      // Wait 2 seconds and check Monime's actual status
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const statusCheck = await monimeService.getPayoutStatus(
          payout.id,
          eventFetch
        );
        finalPayoutStatus = statusCheck.status;
        finalPayout = statusCheck;
      } catch (statusError) {
        console.error("Error checking payout status after delay:", statusError);
        // If status check fails, use the original status
        // Don't fail the whole operation
      }
    }

    // Map Monime statuses to our database statuses
    // Monime statuses: "pending", "processing", "completed", "failed", "cancelled"
    // Also check for transactionReference in destination - this indicates the transaction was completed by the mobile money provider
    let newStatus: string;
    const hasTransactionReference =
      finalPayout.destination?.transactionReference;

    if (
      finalPayoutStatus === "completed" ||
      finalPayoutStatus === "paid" ||
      hasTransactionReference
    ) {
      // Transaction is completed if:
      // 1. Payout status is "completed" or "paid"
      // 2. OR destination has a transactionReference (means mobile money provider processed it)
      newStatus = "completed";
    } else if (
      finalPayoutStatus === "failed" ||
      finalPayoutStatus === "cancelled"
    ) {
      newStatus = "failed";
    } else {
      // "pending" or "processing" -> keep as "pending" in our DB
      newStatus = "pending";
    }

    const updatedMetadata = {
      ...metadata,
      payout_id: payout.id,
      payout_status: finalPayoutStatus,
      actual_monime_fees: monimeFees,
      executed_at: new Date().toISOString(),
      execution_method: "multisig_auto",
      transaction_reference:
        finalPayout.destination?.transactionReference || null,
      monime_response: finalPayout,
      last_status_check: new Date().toISOString(),
    };

    const { data: updateResult, error: updateError } = await supabase.rpc(
      "update_withdrawal_status",
      {
        p_withdrawal_id: withdrawal_id,
        p_status: newStatus,
        p_external_id: payout.id,
        p_metadata: updatedMetadata,
      }
    );

    if (updateError) {
      return json(
        {
          success: false,
          message:
            "Withdrawal executed but failed to update record. Contact support.",
        },
        { status: 500 }
      );
    }

    if (
      !updateResult ||
      updateResult.length === 0 ||
      !updateResult[0].success
    ) {
      return json(
        {
          success: false,
          message:
            updateResult?.[0]?.message ||
            "Failed to update withdrawal status. Contact support.",
        },
        { status: 500 }
      );
    }

    return json({
      success: true,
      message: "Withdrawal executed successfully.",
      payout_status: finalPayoutStatus,
      database_status: newStatus,
    });
  } catch (error: any) {
    return json(
      {
        success: false,
        message: error.message || "Failed to execute withdrawal.",
      },
      { status: 500 }
    );
  }
};
