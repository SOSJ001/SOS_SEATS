import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { fetchPayout, ledgerStatusForPayout } from "$lib/server/payments";
import {
  getLedgerKey,
  listWalletTransactions,
  updateWalletTransaction,
} from "$lib/server/wallet";

/**
 * POST /api/wallet/sync-payouts
 * Refresh the signed-in organiser's own pending withdrawals from Monime.
 */
export const POST: RequestHandler = async ({ locals }) => {
  const ledgerKey = getLedgerKey(locals);
  if (!ledgerKey) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const pending = await listWalletTransactions(ledgerKey, {
    type: "withdrawal",
    status: "pending",
    limit: 20,
  });
  if (pending.error) {
    return json({ success: false, error: pending.error }, { status: 500 });
  }

  let updated = 0;
  for (const row of pending.data) {
    if (!row.external_id) continue;
    const result = await fetchPayout(row.external_id);
    if (!result.ok) continue;

    const payout = result.payout;
    const status = ledgerStatusForPayout(payout) || row.status;
    const { error } = await updateWalletTransaction(
      row.id,
      {
        status,
        metadata: {
          ...(row.metadata || {}),
          payout_status: payout?.status || null,
          last_status_check: new Date().toISOString(),
          transaction_reference: payout?.destination?.transactionReference || null,
          monime_response: payout,
        },
      },
      ledgerKey
    );
    if (!error && status !== row.status) updated++;
  }

  return json({ success: true, data: { updated } });
};
