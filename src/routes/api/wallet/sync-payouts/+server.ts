import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { fetchPayout, ledgerStatusForPayout, sendPayout } from "$lib/server/payments";
import {
  getLedgerKey,
  listWalletTransactions,
  updateWalletTransaction,
} from "$lib/server/wallet";

/** On-hold rows younger than this may still have their first request in flight. */
const RETRY_AFTER_MS = 2 * 60 * 1000;

/**
 * POST /api/wallet/sync-payouts
 * Refresh the signed-in organiser's own pending withdrawals from Monime, and
 * retry on-hold ones (no Monime payout id) with their stored idempotency key.
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
    if (!row.external_id) {
      if (await retryOnHold(row, ledgerKey)) updated++;
      continue;
    }
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

/**
 * Re-send an on-hold withdrawal with its stored key and request. Monime returns
 * the original payout if the first attempt reached it, or creates it now.
 * Returns true when the row's status changed.
 */
async function retryOnHold(row: any, ledgerKey: string): Promise<boolean> {
  const meta = row.metadata || {};
  const request = meta.payout_request;
  const key = meta.idempotency_key;
  if (!request || !key) return false;
  if (Date.now() - new Date(row.created_at).getTime() < RETRY_AFTER_MS) return false;

  let result: Awaited<ReturnType<typeof sendPayout>>;
  try {
    result = await sendPayout({ ...request, idempotencyKey: key });
  } catch (err) {
    console.error("[sync-payouts] retry error:", err);
    return false;
  }
  const checkedAt = new Date().toISOString();

  if (!result.ok) {
    // 409 (key in use) and 5xx stay on hold; other 4xx mean nothing was sent.
    if (result.status === 409 || result.status >= 500) {
      await updateWalletTransaction(
        row.id,
        { metadata: { ...meta, last_error: result.error, last_status_check: checkedAt } },
        ledgerKey
      );
      return false;
    }
    const { error } = await updateWalletTransaction(
      row.id,
      { status: "failed", metadata: { ...meta, error: result.error, last_status_check: checkedAt } },
      ledgerKey
    );
    return !error;
  }

  const payout = result.payout;
  const status = ledgerStatusForPayout(payout) || "pending";
  const { error } = await updateWalletTransaction(
    row.id,
    {
      status,
      external_id: payout?.id || null,
      metadata: {
        ...meta,
        payout_id: payout?.id || null,
        payout_status: payout?.status || null,
        last_status_check: checkedAt,
        monime_response: payout,
      },
    },
    ledgerKey
  );
  return !error && status !== row.status;
}
