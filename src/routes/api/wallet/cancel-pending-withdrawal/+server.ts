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

    // Call the database function to cancel the withdrawal
    const { data: result, error: rpcError } = await supabase.rpc(
      "cancel_pending_withdrawal",
      {
        p_withdrawal_id: withdrawal_id,
        p_wallet_address: wallet_address,
      }
    );

    if (rpcError) {
      console.error("Error cancelling withdrawal:", rpcError);
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
  } catch (error: any) {
    console.error("Error in cancel withdrawal:", error);
    return json(
      { success: false, message: error.message || "Failed to cancel withdrawal." },
      { status: 500 }
    );
  }
};

