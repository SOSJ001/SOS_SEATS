import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getServerSupabase } from "$lib/server/db";

/**
 * Lookup order created by webhook fulfill (roadmap 5.4).
 * Auth required; only returns the caller's own order (buyer_id match).
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
    const db = getServerSupabase();
    let query = db
      .from("orders")
      .select("id, order_number, buyer_id, payment_method")
      .eq("transaction_hash", transactionId)
      .eq("event_id", eventId);

    if (paymentMethod) {
      query = query.eq("payment_method", paymentMethod);
    }

    let { data: order, error } = await query.maybeSingle();

    // RPC historically hardcodes orange_money; retry without method filter
    if (!order && !error && paymentMethod) {
      const retry = await db
        .from("orders")
        .select("id, order_number, buyer_id, payment_method")
        .eq("transaction_hash", transactionId)
        .eq("event_id", eventId)
        .maybeSingle();
      order = retry.data;
      error = retry.error;
    }

    if (error) {
      return json(
        { success: false, error: error.message || "Lookup failed" },
        { status: 500 }
      );
    }

    if (!order) {
      return json({ success: true, found: false });
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
