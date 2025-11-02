import { supabase } from "$lib/supabase";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const { token } = params;

  if (!token) {
    throw error(400, "Missing withdrawal token");
  }

  try {
    // Load pending withdrawal by token
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("pending_token", token)
      .eq("status", "pending_approval")
      .single();

    if (withdrawalError || !withdrawal) {
      throw error(404, "Withdrawal not found or already processed");
    }

    // Check if expired
    if (withdrawal.expires_at && new Date(withdrawal.expires_at) < new Date()) {
      // Update status to cancelled
      await supabase
        .from("wallet_transactions")
        .update({ status: "cancelled" })
        .eq("id", withdrawal.id);

      throw error(410, "Withdrawal has expired");
    }

    // Load multisig config to get authorized signers
    let authorizedSigners: string[] = [withdrawal.wallet_address]; // Primary wallet always included

    if (withdrawal.multisig_enabled) {
      const { data: config } = await supabase.rpc("get_multisig_config", {
        p_wallet_address: withdrawal.wallet_address,
      });

      if (config && config.length > 0 && config[0].signers) {
        const signers = Array.isArray(config[0].signers)
          ? config[0].signers
          : [];
        authorizedSigners = [
          withdrawal.wallet_address,
          ...signers
            .filter((s: any) => s.is_active)
            .map((s: any) => s.signer_wallet_address),
        ];
      }
    }

    return {
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        wallet_address: withdrawal.wallet_address,
        created_at: withdrawal.created_at,
        expires_at: withdrawal.expires_at,
        required_signatures: withdrawal.required_signatures,
        collected_signatures: withdrawal.collected_signatures || [],
        metadata: withdrawal.metadata || {},
        pending_token: withdrawal.pending_token,
        multisig_enabled: withdrawal.multisig_enabled,
      },
      authorizedSigners,
    };
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error("Error loading pending withdrawal:", err);
    throw error(500, "Failed to load withdrawal details");
  }
};

