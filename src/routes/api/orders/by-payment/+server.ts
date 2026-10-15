import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getServerSupabase } from "$lib/server/db";
import {
  fetchPaymentCodeFromMonime,
  fulfillPaymentCode,
} from "$lib/server/payments";

async function findOrder(transactionId: string, eventId: string, paymentMethod: string) {
  const db = getServerSupabase();
  const lookup = (method?: string) => {
    let query = db
      .from("orders")
      .select("id, order_number, buyer_id, payment_method")
      .eq("transaction_hash", transactionId)
      .eq("event_id", eventId);
    if (method) query = query.eq("payment_method", method);
    return query.order("created_at", { ascending: true }).limit(1);
  };

  let { data, error } = await lookup(paymentMethod || undefined);
  // RPC historically hardcodes orange_money; retry without method filter
  if (!data?.length && !error && paymentMethod) {
    ({ data, error } = await lookup());
  }
  if (error) throw new Error(error.message || "Lookup failed");
  return data?.[0] ?? null;
}

/**
 * Order for a marketplace payment code (roadmap 5.4).
 * Auth required; only returns the caller's own order (buyer_id match).
 * If Monime says the code is paid but no order exists yet (webhook late or
 * missing), creates it here; safe alongside the webhook.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const eventId = url.searchParams.get("eventId")?.trim() || "";
  const transactionId = url.searchParams.get("transactionId")?.trim() || "";
  const paymentMethod = url.searchParams.get("paymentMethod")?.trim() || "";

  if (!eventId || !transactionId) {
    return json(
      { success: false, error: "eventId and transactionId are required" },
      { status: 400 }
    );
  }

  try {
    let order = await findOrder(transactionId, eventId, paymentMethod);

    if (!order) {
      const code = await fetchPaymentCodeFromMonime(transactionId);
      const meta = (code?.metadata || {}) as Record<string, unknown>;
      if (
        !code ||
        String(meta.buyer_id || "") !== locals.userId ||
        String(meta.event_id || "") !== eventId
      ) {
        return json({ success: true, found: false });
      }
      if (String(code.status || "").toLowerCase() !== "completed") {
        return json({ success: true, found: false });
      }

      const fulfilled = await fulfillPaymentCode({
        paymentCodeId: transactionId,
        metadata: meta,
        data: code,
      });
      if (!fulfilled.ok) {
        return json({
          success: true,
          found: false,
          paidNoTickets: true,
          error: fulfilled.error,
        });
      }
      order = await findOrder(transactionId, eventId, paymentMethod);
      if (!order) {
        return json({ success: true, found: false });
      }
    }

    if (!order.buyer_id || order.buyer_id !== locals.userId) {
      // Not owned yet or owned by someone else — do not leak
      if (order.buyer_id && order.buyer_id !== locals.userId) {
        return json({ success: false, error: "Forbidden" }, { status: 403 });
      }
      return json({ success: true, found: false });
    }

    return json({
      success: true,
      found: true,
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (err) {
    return json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Lookup failed",
      },
      { status: 500 }
    );
  }
};
