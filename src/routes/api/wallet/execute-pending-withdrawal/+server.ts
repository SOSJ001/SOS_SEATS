import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabase } from "$lib/supabase";
import { monimeService } from "$lib/monime";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { withdrawal_id } = await request.json();

    if (!withdrawal_id) {
      return json({ success: false, message: "Withdrawal ID required" }, { status: 400 });
    }

    // Load pending withdrawal
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("id", withdrawal_id)
      .eq("status", "pending_approval")
      .eq("multisig_enabled", true)
      .single();

    if (withdrawalError || !withdrawal) {
      return json(
        { success: false, message: "Pending withdrawal not found or already processed" },
        { status: 404 }
      );
    }

    // Check if expired
    if (withdrawal.expires_at && new Date(withdrawal.expires_at) < new Date()) {
      // Update status to cancelled
      await supabase
        .from("wallet_transactions")
        .update({ status: "cancelled" })
        .eq("id", withdrawal_id);

      return json(
        { success: false, message: "Withdrawal has expired" },
        { status: 410 }
      );
    }

    // Verify threshold is met
    const signatureCount = Array.isArray(withdrawal.collected_signatures)
      ? withdrawal.collected_signatures.length
      : 0;

    if (signatureCount < withdrawal.required_signatures) {
      return json(
        { success: false, message: `Threshold not met. Need ${withdrawal.required_signatures} signatures, have ${signatureCount}` },
        { status: 400 }
      );
    }

    // Check if already executed
    if (withdrawal.status !== "pending_approval") {
      return json(
        { success: false, message: "Withdrawal already processed" },
        { status: 400 }
      );
    }

    // Extract withdrawal details from metadata
    const metadata = withdrawal.metadata || {};
    const provider = metadata.provider || "orange_money";
    const phoneNumber = metadata.phone_number;
    const netAmountAfterPlatformFee = metadata.net_amount_after_platform_fee || Math.abs(withdrawal.amount);
    const currency = withdrawal.currency || "NLe";

    if (!phoneNumber) {
      return json(
        { success: false, message: "Phone number missing from withdrawal metadata" },
        { status: 400 }
      );
    }

    // Map provider to Monime provider code
    const providerCode = provider === "orange_money" ? "m17" : "m18";

    // Execute withdrawal via Monime API
    const payout = await monimeService.createPayout(
      {
        currency: currency,
        value: netAmountAfterPlatformFee,
      },
      {
        providerCode: providerCode,
        accountId: phoneNumber,
      },
      undefined, // source (optional)
      {
        wallet_address: withdrawal.wallet_address,
        withdrawal_type: "mobile_money",
        multisig_withdrawal_id: withdrawal_id,
        original_metadata: metadata,
      },
      `multisig_withdrawal_${withdrawal_id}_${Date.now()}`
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

    // Update withdrawal record with payout details and mark as completed/pending
    const updateData: any = {
      status: payout.status === "completed" ? "completed" : "pending",
      external_id: payout.id,
      metadata: {
        ...metadata,
        payout_id: payout.id,
        payout_status: payout.status,
        actual_monime_fees: monimeFees,
        executed_at: new Date().toISOString(),
        execution_method: "multisig_auto",
      },
    };

    const { error: updateError } = await supabase
      .from("wallet_transactions")
      .update(updateData)
      .eq("id", withdrawal_id);

    if (updateError) {
      console.error("Error updating withdrawal:", updateError);
      return json(
        { success: false, message: "Failed to update withdrawal record" },
        { status: 500 }
      );
    }

    return json({
      success: true,
      message: `Withdrawal ${payout.status === "completed" ? "completed" : "submitted"}. ${currency} ${metadata.final_net_amount?.toFixed(2) || netAmountAfterPlatformFee.toFixed(2)} sent to ${phoneNumber}.`,
      payout: {
        id: payout.id,
        status: payout.status,
      },
    });
  } catch (error: any) {
    console.error("Error executing pending withdrawal:", error);
    return json(
      {
        success: false,
        message: error.message || "Failed to execute withdrawal. Please try again.",
      },
      { status: 500 }
    );
  }
};

