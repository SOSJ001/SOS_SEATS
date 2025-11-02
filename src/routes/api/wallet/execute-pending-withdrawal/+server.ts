import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { supabase } from "$lib/supabase";
import { monimeService } from "$lib/monime";


export const POST: RequestHandler = async ({ request }) => {
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
        { success: false, message: "Pending withdrawal not found or not eligible for execution." },
        { status: 404 }
      );
    }

    // Verify if signature threshold is met
    if (withdrawal.collected_signatures.length < withdrawal.required_signatures) {
      return json(
        { success: false, message: "Signature threshold not met yet." },
        { status: 403 }
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

    // Execute payout via Monime API
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
        monime_response: payout,
      },
    };

    const { error: updateError } = await supabase
      .from("wallet_transactions")
      .update(updateData)
      .eq("id", withdrawal_id);

    if (updateError) {
      console.error("Error updating withdrawal status after payout:", updateError);
      return json(
        { success: false, message: "Withdrawal executed but failed to update record. Contact support." },
        { status: 500 }
      );
    }

    return json(
      { success: true, message: "Withdrawal executed successfully.", payout_status: payout.status }
    );
  } catch (error: any) {
    console.error("Error executing pending withdrawal:", error);
    return json(
      { success: false, message: error.message || "Failed to execute withdrawal." },
      { status: 500 }
    );
  }
};

