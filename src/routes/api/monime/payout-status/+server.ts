import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { fetchPayout } from "$lib/server/payments";
import { getLedgerKey } from "$lib/server/wallet";
import { getServerSupabase } from "$lib/server/db";

/** Monime status of a payout that belongs to the signed-in user's ledger. */
export const GET: RequestHandler = async ({ url, locals }) => {
  const ledgerKey = getLedgerKey(locals);
  if (!ledgerKey) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payoutId = url.searchParams.get("payoutId");
  if (!payoutId) {
    return json({ success: false, error: "Payout ID required" }, { status: 400 });
  }

  try {
    const { data: owned } = await getServerSupabase()
      .from("wallet_transactions")
      .select("id")
      .eq("wallet_address", ledgerKey)
      .eq("external_id", payoutId)
      .limit(1);
    if (!owned || owned.length === 0) {
      return json({ success: false, error: "Not found" }, { status: 404 });
    }

    const result = await fetchPayout(payoutId);
    if (!result.ok) {
      return json({ success: false, error: result.error }, { status: result.status });
    }
    return json({ success: true, data: result.payout });
  } catch (error) {
    console.error("Payout status check error:", error);
    return json(
      { success: false, error: "Failed to get payout status" },
      { status: 500 }
    );
  }
};
