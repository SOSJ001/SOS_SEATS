import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { getServerSupabase } from "$lib/server/db";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    if (!locals.userId && !locals.web3UserId) {
      return json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { withdrawal_id, wallet_address } = await request.json();
    const db = getServerSupabase();

    if (!withdrawal_id || !wallet_address) {
      return json(
        {
          success: false,
          message: "Withdrawal ID and wallet address are required.",
        },
        { status: 400 }
      );
    }

    const { data: withdrawal, error: fetchError } = await db
      .from("wallet_transactions")
      .select(
        "id, status, wallet_address, multisig_enabled, external_id, metadata"
      )
      .eq("id", withdrawal_id)
      .single();

    if (fetchError || !withdrawal) {
      return json(
        { success: false, message: "Withdrawal not found." },
        { status: 404 }
      );
    }

    if (withdrawal.wallet_address !== wallet_address) {
      return json(
        {
          success: false,
          message: "You can only cancel your own withdrawals.",
        },
        { status: 403 }
      );
    }

    if (withdrawal.status === "completed") {
      return json(
        { success: false, message: "Cannot cancel a completed withdrawal." },
        { status: 400 }
      );
    }

    if (withdrawal.status === "cancelled") {
      return json(
        {
          success: false,
          message: "This withdrawal has already been cancelled.",
        },
        { status: 400 }
      );
    }

    if (
      withdrawal.status === "pending_approval" &&
      withdrawal.multisig_enabled
    ) {
      const { data: result, error: rpcError } = await db.rpc(
        "cancel_pending_withdrawal",
        {
          p_withdrawal_id: withdrawal_id,
          p_wallet_address: wallet_address,
        }
      );

      if (rpcError) {
        return json(
          {
            success: false,
            message: rpcError.message || "Failed to cancel withdrawal.",
          },
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
          {
            success: false,
            message: response.message || "Failed to cancel withdrawal.",
          },
          { status: 400 }
        );
      }

      return json({
        success: true,
        message: response.message || "Withdrawal cancelled successfully.",
      });
    }

    if (withdrawal.status === "pending") {
      const { data: result, error: rpcError } = await db.rpc(
        "cancel_standard_withdrawal",
        {
          p_withdrawal_id: withdrawal_id,
          p_wallet_address: wallet_address,
        }
      );

      if (rpcError) {
        return json(
          {
            success: false,
            message: rpcError.message || "Failed to cancel withdrawal.",
          },
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
          {
            success: false,
            message: response.message || "Failed to cancel withdrawal.",
          },
          { status: 400 }
        );
      }

      return json({
        success: true,
        message:
          response.message ||
          "Withdrawal cancelled successfully. Funds remain in your balance.",
      });
    }

    return json(
      {
        success: false,
        message: `Cannot cancel withdrawal with status: ${withdrawal.status}`,
      },
      { status: 400 }
    );
  } catch (error: any) {
    return json(
      {
        success: false,
        message: error.message || "Failed to cancel withdrawal.",
      },
      { status: 500 }
    );
  }
};
