import { getPendingWithdrawalByToken } from "$lib/server/wallet";
import { getServerSupabase } from "$lib/server/db";
import { error } from "@sveltejs/kit";

export async function load({ params }) {
  try {
    const { token } = params;

    if (!token) {
      throw error(400, "Token parameter is required.");
    }

    const {
      data: withdrawal,
      error: dbError,
      anyStatus: withdrawalAnyStatus,
    } = await getPendingWithdrawalByToken(token);

    if (dbError) {
      if (
        dbError.includes("fetch failed") ||
        dbError.includes("Failed to fetch")
      ) {
        throw error(500, "Database connection failed. Please try again later.");
      }
      throw error(500, "Failed to load withdrawal details.");
    }

    if (withdrawalAnyStatus && withdrawalAnyStatus.status !== "pending_approval") {
      if (withdrawalAnyStatus.status === "cancelled") {
        throw error(410, "This withdrawal has been cancelled.");
      } else if (
        withdrawalAnyStatus.status === "completed" ||
        withdrawalAnyStatus.status === "pending"
      ) {
        throw error(410, "This withdrawal has already been processed.");
      } else {
        throw error(
          410,
          `This withdrawal has status: ${withdrawalAnyStatus.status}`
        );
      }
    }

    if (!withdrawal) {
      if (withdrawalAnyStatus) {
        if (withdrawalAnyStatus.status === "cancelled") {
          throw error(410, "This withdrawal has been cancelled.");
        } else {
          throw error(410, "This withdrawal has already been processed.");
        }
      }
      throw error(404, "Pending withdrawal not found.");
    }

    if (withdrawal.expires_at && new Date(withdrawal.expires_at) < new Date()) {
      throw error(400, "This withdrawal request has expired.");
    }

    let authorizedSigners: any[] = [];
    if (withdrawal.multisig_enabled) {
      try {
        const db = getServerSupabase();
        const { data: config, error: configError } = await db.rpc(
          "get_multisig_config",
          {
            p_wallet_address: withdrawal.wallet_address,
          }
        );

        if (!configError && config && config.length > 0) {
          const { data: signers, error: signersError } = await db.rpc(
            "get_multisig_signers",
            {
              p_wallet_address: withdrawal.wallet_address,
            }
          );

          if (!signersError && signers) {
            authorizedSigners = signers;
          }
        }
      } catch {
        // Continue without signers
      }
    }

    return {
      withdrawal,
      authorizedSigners,
      pending_token: withdrawal.pending_token,
      multisig_enabled: withdrawal.multisig_enabled,
    };
  } catch (err: any) {
    if (err.status && err.body) {
      throw err;
    }
    throw error(500, err.message || "Failed to load withdrawal details.");
  }
}
