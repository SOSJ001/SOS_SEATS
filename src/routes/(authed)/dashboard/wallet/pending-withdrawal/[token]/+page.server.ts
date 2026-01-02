import { supabase } from "$lib/supabase.js";
import { error } from "@sveltejs/kit";

export async function load({ params }) {
  try {
    const { token } = params;

    if (!token) {
      throw error(400, "Token parameter is required.");
    }

    // First, check if withdrawal exists with any status (to handle cancelled/processed withdrawals)
    const { data: withdrawalAnyStatus, error: checkError } = await supabase
      .from("wallet_transactions")
      .select("status, updated_at, expires_at")
      .eq("pending_token", token)
      .eq("type", "withdrawal")
      .maybeSingle();

    if (checkError) {
      // Check if it's a fetch/network error
      if (checkError.message?.includes("fetch failed") || checkError.message?.includes("Failed to fetch")) {
        throw error(500, "Database connection failed. Please try again later.");
      }
      throw error(500, "Failed to load withdrawal details.");
    }

    // If withdrawal exists but is not pending, provide appropriate feedback
    if (withdrawalAnyStatus && withdrawalAnyStatus.status !== "pending_approval") {
      if (withdrawalAnyStatus.status === "cancelled") {
        throw error(410, "This withdrawal has been cancelled."); // 410 Gone
      } else if (withdrawalAnyStatus.status === "completed" || withdrawalAnyStatus.status === "pending") {
        throw error(410, "This withdrawal has already been processed."); // 410 Gone
      } else {
        throw error(410, `This withdrawal has status: ${withdrawalAnyStatus.status}`);
      }
    }

    // Load pending withdrawal by token (only if status is pending_approval)
    const { data: withdrawal, error: dbError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("pending_token", token)
      .eq("type", "withdrawal")
      .eq("status", "pending_approval")
      .maybeSingle();

    if (dbError) {
      throw error(500, "Failed to load withdrawal details.");
    }

    if (!withdrawal) {
      // Double check - maybe status changed between queries
      if (withdrawalAnyStatus) {
        if (withdrawalAnyStatus.status === "cancelled") {
          throw error(410, "This withdrawal has been cancelled.");
        } else {
          throw error(410, "This withdrawal has already been processed.");
        }
      }
      throw error(404, "Pending withdrawal not found.");
    }

    // Check if expired
    if (withdrawal.expires_at && new Date(withdrawal.expires_at) < new Date()) {
      throw error(400, "This withdrawal request has expired.");
    }

    // Load multisig config to get authorized signers
    let authorizedSigners: any[] = [];
    if (withdrawal.multisig_enabled) {
      try {
        const { data: config, error: configError } = await supabase.rpc("get_multisig_config", {
          p_wallet_address: withdrawal.wallet_address,
        });

        if (!configError && config && config.length > 0) {
          const { data: signers, error: signersError } = await supabase.rpc("get_multisig_signers", {
            p_wallet_address: withdrawal.wallet_address,
          });

          if (!signersError && signers) {
            authorizedSigners = signers;
          }
        }
      } catch (multisigError) {
        // Continue without signers if there's an error
      }
    }

    return {
      withdrawal,
      authorizedSigners,
      pending_token: withdrawal.pending_token,
      multisig_enabled: withdrawal.multisig_enabled,
    };
  } catch (err: any) {
    // If it's already an HTTP error from SvelteKit (like 410 for cancelled/processed), rethrow it
    // These are expected errors and are handled by the error component
    if (err.status && err.body) {
      // Only log unexpected errors (not 410 Gone errors which are expected)
      if (err.status !== 410) {
        // console.error("Error in load function:", err); // Removed console.error
      }
      throw err;
    }
    // Log unexpected errors (500, network errors, etc.)
    // console.error("Error in load function:", err); // Removed console.error
    // Otherwise, wrap it in a 500 error
    throw error(500, err.message || "Failed to load withdrawal details.");
  }
}

