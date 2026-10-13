import { json } from "@sveltejs/kit";
import {
  getLedgerKey,
  listWalletTransactions,
  getWalletTransactionById,
  listOrdersForWallet,
  getOrderById,
  listOrganizerOrders,
} from "$lib/server/wallet";
import { assertEventOwnedByUser } from "$lib/server/events";

/**
 * Read-only wallet data for the signed-in user. Every action is scoped to the
 * session's ledger key or user id; nothing is taken from the query to widen it.
 * Ledger writes happen only in /api/wallet/withdraw and /api/wallet/sync-payouts.
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ url, locals }) {
  const userId = locals.userId;
  const ledgerKey = getLedgerKey(locals);
  if (!userId || !ledgerKey) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const action = url.searchParams.get("action") || "transactions";

  if (action === "transactions") {
    const result = await listWalletTransactions(ledgerKey, {
      limit: Math.min(Number(url.searchParams.get("limit") || 100), 500),
      type: url.searchParams.get("type") || undefined,
      status: url.searchParams.get("status") || undefined,
    });
    if (result.error) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    return json({ success: true, data: result.data });
  }

  if (action === "transaction") {
    const id = url.searchParams.get("id");
    if (!id) {
      return json({ success: false, error: "id required" }, { status: 400 });
    }
    const result = await getWalletTransactionById(id, ledgerKey);
    if (result.error) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    if (!result.data) {
      return json({ success: false, error: "Not found" }, { status: 404 });
    }
    return json({ success: true, data: result.data });
  }

  if (action === "orders") {
    const result = await listOrdersForWallet(ledgerKey);
    if (result.error) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    return json({ success: true, data: result.data });
  }

  if (action === "order") {
    const id = url.searchParams.get("id");
    if (!id) {
      return json({ success: false, error: "id required" }, { status: 400 });
    }
    const result = await getOrderById(id);
    if (result.error) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    const order = result.data;
    const allowed =
      order &&
      (order.buyer_id === userId ||
        (order.event_id && (await assertEventOwnedByUser(order.event_id, userId))));
    if (!allowed) {
      return json({ success: false, error: "Not found" }, { status: 404 });
    }
    return json({ success: true, data: order });
  }

  if (action === "organizer-orders") {
    const eventId = url.searchParams.get("event_id") || undefined;
    const paymentMethods = (url.searchParams.get("payment_methods") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const paymentStatuses = (url.searchParams.get("payment_statuses") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const limitParam = url.searchParams.get("limit");
    const result = await listOrganizerOrders(userId, {
      eventId,
      paymentMethods: paymentMethods.length ? paymentMethods : undefined,
      paymentStatuses: paymentStatuses.length ? paymentStatuses : ["paid", "completed"],
      limit: limitParam ? Number(limitParam) : undefined,
    });
    if (result.error) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    return json({ success: true, data: result.data });
  }

  if (action === "signer-pending") {
    // Multisig is switched off.
    return json({ success: true, data: [] });
  }

  return json({ success: false, error: "Unknown action" }, { status: 400 });
}

/** Ledger writes from the browser are no longer accepted. */
export async function POST() {
  return json(
    { success: false, error: "Not allowed" },
    { status: 405 }
  );
}
