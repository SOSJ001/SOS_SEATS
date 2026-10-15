/**
 * Marketplace ticket holds (checkout_holds). A hold reserves tickets while the
 * buyer pays and doubles as the buyer's payment history. Service role only.
 * Do not import from client components.
 */
import { getServerSupabase } from "$lib/server/db";

/** Holds outlive the 30 minute Monime payment code by a few minutes. */
export const PRIVATE_ISSUE_PENDING_MINUTES = 35;

export type CreateHoldResult =
  | { ok: true; holdId: string; replacedCodeIds: string[] }
  | { ok: false; code: "unavailable" | "invalid_selection"; message: string };

export async function createCheckoutHold(input: {
  eventId: string;
  buyerId: string;
  selectedTickets: Record<string, number>;
  amount: number;
  paymentMethod: string;
}): Promise<CreateHoldResult> {
  await expireStalePayments();
  const { data, error } = await getServerSupabase().rpc("create_checkout_hold", {
    p_event_id: input.eventId,
    p_buyer_id: input.buyerId,
    p_selected_tickets: input.selectedTickets,
    p_amount: input.amount,
    p_payment_method: input.paymentMethod,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.success || !row.hold_id) {
    return {
      ok: false,
      code: row?.error_code === "unavailable" ? "unavailable" : "invalid_selection",
      message: row?.error_message || "Sorry, this ticket is no longer available.",
    };
  }
  return {
    ok: true,
    holdId: row.hold_id,
    replacedCodeIds: (row.replaced_payment_code_ids || []).filter(Boolean),
  };
}

export async function updateHold(holdId: string, updates: Record<string, unknown>) {
  const { error } = await getServerSupabase()
    .from("checkout_holds")
    .update(updates)
    .eq("id", holdId);
  if (error) console.error("[updateHold]", holdId, error.message);
}

export type HoldRow = {
  id: string;
  event_id: string;
  buyer_id: string;
  status: string;
  paid: boolean;
  payment_code_id: string | null;
  order_id: string | null;
  amount: number | string;
};

/**
 * The hold behind a payment code. Falls back to the hold id saved in the code's
 * metadata and attaches the code to it, in case saving the code id failed.
 */
export async function findHoldForPaymentCode(
  paymentCodeId: string,
  holdIdFromMetadata?: string | null
): Promise<HoldRow | null> {
  const db = getServerSupabase();
  const columns = "id, event_id, buyer_id, status, paid, payment_code_id, order_id, amount";
  const { data } = await db
    .from("checkout_holds")
    .select(columns)
    .eq("payment_code_id", paymentCodeId)
    .maybeSingle();
  if (data) return data as HoldRow;

  const holdId = String(holdIdFromMetadata || "").trim();
  if (!holdId) return null;
  const { data: byId } = await db
    .from("checkout_holds")
    .select(columns)
    .eq("id", holdId)
    .is("payment_code_id", null)
    .maybeSingle();
  if (!byId) return null;
  await updateHold(byId.id, { payment_code_id: paymentCodeId });
  return { ...(byId as HoldRow), payment_code_id: paymentCodeId };
}

/**
 * Held tickets per ticket type for an event, from other buyers' active holds.
 * The viewer's own holds are left out so they never block their own checkout.
 */
export async function getActiveHoldCounts(
  eventId: string,
  viewerId?: string | null
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  try {
    let query = getServerSupabase()
      .from("checkout_holds")
      .select("selected_tickets, buyer_id")
      .eq("event_id", eventId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString());
    if (viewerId) query = query.neq("buyer_id", viewerId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    for (const hold of data || []) {
      for (const [typeId, qty] of Object.entries(hold.selected_tickets || {})) {
        const n = Number(qty);
        if (Number.isFinite(n) && n > 0) counts[typeId] = (counts[typeId] || 0) + n;
      }
    }
  } catch (err) {
    console.error("[getActiveHoldCounts]", err);
  }
  return counts;
}

/** Mark the hold or private issue row for a payment code that Monime ended. */
export async function markPaymentCodeEnded(
  paymentCodeId: string,
  status: "cancelled" | "expired"
) {
  const db = getServerSupabase();
  const { error: holdError } = await db
    .from("checkout_holds")
    .update({ status })
    .eq("payment_code_id", paymentCodeId)
    .eq("status", "pending")
    .eq("paid", false);
  if (holdError) console.error("[markPaymentCodeEnded] hold", holdError.message);

  const { data: rows } = await db
    .from("wallet_transactions")
    .select("id, metadata")
    .eq("type", "private_issue_payment")
    .eq("external_id", paymentCodeId)
    .eq("status", "pending")
    .limit(1);
  const row = rows?.[0];
  if (row) {
    const { error } = await db
      .from("wallet_transactions")
      .update({
        status: "cancelled",
        metadata: { ...(row.metadata || {}), cancel_reason: status },
      })
      .eq("id", row.id)
      .eq("status", "pending");
    if (error) console.error("[markPaymentCodeEnded] private issue", error.message);
  }
}

/**
 * Lazy sweep (no cron): unpaid holds past their expiry become expired, and
 * pending private issue payments older than the code lifetime become cancelled.
 * A later "completed" from Monime still wins over both.
 */
export async function expireStalePayments() {
  const db = getServerSupabase();
  const now = new Date();
  try {
    await db
      .from("checkout_holds")
      .update({ status: "expired" })
      .eq("status", "pending")
      .eq("paid", false)
      .lte("expires_at", now.toISOString());

    const cutoff = new Date(now.getTime() - PRIVATE_ISSUE_PENDING_MINUTES * 60 * 1000);
    const { data: stale } = await db
      .from("wallet_transactions")
      .select("id, metadata")
      .eq("type", "private_issue_payment")
      .eq("status", "pending")
      .lte("created_at", cutoff.toISOString())
      .limit(200);
    for (const row of stale || []) {
      await db
        .from("wallet_transactions")
        .update({
          status: "cancelled",
          metadata: { ...(row.metadata || {}), cancel_reason: "expired" },
        })
        .eq("id", row.id)
        .eq("status", "pending");
    }
  } catch (err) {
    console.error("[expireStalePayments]", err);
  }
}
