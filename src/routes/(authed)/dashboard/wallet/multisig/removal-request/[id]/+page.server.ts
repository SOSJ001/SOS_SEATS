import { supabase } from "$lib/supabase";
import { error, redirect } from "@sveltejs/kit";
import { WEB3_ENABLED } from "$lib/features.js";

export async function load({ params }) {
  if (!WEB3_ENABLED) throw redirect(303, "/dashboard/wallet");

  const { id } = params;

  // Load removal request
  const { data: removalRequest, error: dbError } = await supabase
    .from("multisig_removal_requests")
    .select("*")
    .eq("id", id)
    .eq("status", "pending")
    .maybeSingle();

  if (dbError) {
    console.error("Error loading removal request:", dbError);
    throw error(500, "Failed to load removal request.");
  }

  if (!removalRequest) {
    throw error(404, "Removal request not found or already processed.");
  }

  // Check if expired
  if (removalRequest.expires_at && new Date(removalRequest.expires_at) < new Date()) {
    throw error(400, "This removal request has expired.");
  }

  return {
    removalRequest,
  };
}

