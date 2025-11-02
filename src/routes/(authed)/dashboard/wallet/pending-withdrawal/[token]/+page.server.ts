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
      console.error("Error checking withdrawal:", checkError);
      // Check if it's a fetch/network error
      if (checkError.message?.includes("fetch failed") || checkError.message?.includes("Failed to fetch")) {
        console.error("Supabase client fetch failed. Check environment variables and network connection.");
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
      console.error("Error loading pending withdrawal:", dbError);
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
        console.error("Error loading multisig config:", multisigError);
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
    console.error("Error in load function:", err);
    // If it's already an HTTP error from SvelteKit, rethrow it
    if (err.status && err.body) {
      throw err;
    }
    // Otherwise, wrap it in a 500 error
    throw error(500, err.message || "Failed to load withdrawal details.");
  }
}

