import { supabase } from "$lib/supabase";
import { error } from "@sveltejs/kit";

export async function load({ params }) {
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

