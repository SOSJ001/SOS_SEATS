import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { supabase } from "$lib/supabase.js";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { withdrawal_id, wallet_address } = await request.json();

    if (!withdrawal_id || !wallet_address) {
      return json(
        { success: false, message: "Withdrawal ID and wallet address are required." },
        { status: 400 }
      );
    }

    // First, fetch the withdrawal to check its status and type
    const { data: withdrawal, error: fetchError } = await supabase
      .from("wallet_transactions")
      .select("id, status, wallet_address, multisig_enabled, external_id, metadata")
      .eq("id", withdrawal_id)
      .single();

    if (fetchError || !withdrawal) {
      return json(
        { success: false, message: "Withdrawal not found." },
        { status: 404 }
      );
    }

    // Verify wallet ownership
    if (withdrawal.wallet_address !== wallet_address) {
      return json(
        { success: false, message: "You can only cancel your own withdrawals." },
        { status: 403 }
      );
    }

    // Check if withdrawal can be cancelled
    // Note: 'paid' is not a valid status in the database constraint, only 'completed' is used
    if (withdrawal.status === "completed") {
      return json(
        { success: false, message: "Cannot cancel a completed withdrawal." },
        { status: 400 }
      );
    }

    if (withdrawal.status === "cancelled") {
      return json(
        { success: false, message: "This withdrawal has already been cancelled." },
        { status: 400 }
      );
    }

    // Handle multisig withdrawals (pending_approval)
    if (withdrawal.status === "pending_approval" && withdrawal.multisig_enabled) {
      // Call the database function to cancel the multisig withdrawal
      const { data: result, error: rpcError } = await supabase.rpc(
        "cancel_pending_withdrawal",
        {
          p_withdrawal_id: withdrawal_id,
          p_wallet_address: wallet_address,
        }
      );

      if (rpcError) {
        return json(
          { success: false, message: rpcError.message || "Failed to cancel withdrawal." },
          { status: 500 }
        );
      }

      if (!result || result.length === 0) {
        return json(
          { success: false, message: "Failed to cancel withdrawal." },
          { status: 500 }
        );
      }

      const response = result[0];
      if (!response.success) {
        return json(
          { success: false, message: response.message || "Failed to cancel withdrawal." },
          { status: 400 }
        );
      }

      return json({
        success: true,
        message: response.message || "Withdrawal cancelled successfully.",
      });
    }

    // Handle standard pending withdrawals (status: "pending")
    // Use RPC function to bypass RLS policies since there's no UPDATE policy
    if (withdrawal.status === "pending") {
      const { data: result, error: rpcError } = await supabase.rpc(
        "cancel_standard_withdrawal",
        {
          p_withdrawal_id: withdrawal_id,
          p_wallet_address: wallet_address,
        }
      );

      if (rpcError) {
        return json(
          { success: false, message: rpcError.message || "Failed to cancel withdrawal." },
          { status: 500 }
        );
      }

      if (!result || result.length === 0) {
        return json(
          { success: false, message: "Failed to cancel withdrawal." },
          { status: 500 }
        );
      }

      const response = result[0];
      if (!response.success) {
        return json(
          { success: false, message: response.message || "Failed to cancel withdrawal." },
          { status: 400 }
        );
      }

      return json({
        success: true,
        message: response.message || "Withdrawal cancelled successfully. Funds remain in your balance.",
      });
    }

    // Unknown status
    return json(
      { success: false, message: `Cannot cancel withdrawal with status: ${withdrawal.status}` },
      { status: 400 }
    );
  } catch (error: any) {
    return json(
      { success: false, message: error.message || "Failed to cancel withdrawal." },
      { status: 500 }
    );
  }
};

