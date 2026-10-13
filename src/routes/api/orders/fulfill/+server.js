import { json } from "@sveltejs/kit";
import { loadOrderItemsForOrder, getTicketType } from "$lib/server/tickets";
import { getServerSupabase } from "$lib/server/db";
import { assertEventOwnedByUser } from "$lib/server/events";

const ORDER_ACTIONS = new Set([
  "get-order-with-items",
  "list-order-items",
  "get-order-guest-ids",
]);

/**
 * Only the buyer or the event's organiser may read an order.
 * @param {ReturnType<typeof getServerSupabase>} db
 * @param {unknown} orderId
 * @param {string} userId
 */
async function canReadOrder(db, orderId, userId) {
  if (typeof orderId !== "string" || !orderId) return false;
  const { data: order } = await db
    .from("orders")
    .select("buyer_id, event_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return false;
  if (order.buyer_id === userId) return true;
  return !!order.event_id && (await assertEventOwnedByUser(order.event_id, userId));
}

/**
 * Confirmation / post-purchase read helpers (service role).
 * Read-only, signed-in callers only.
 */
/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  const userId = locals.userId;
  if (!userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;
    const db = getServerSupabase();

    if (ORDER_ACTIONS.has(action) && !(await canReadOrder(db, body.orderId, userId))) {
      return json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (action === "get-order-with-items") {
      const { data, error } = await db.rpc("get_order_with_items_by_id", {
        p_order_id: body.orderId,
      });
      if (error) {
        return json({ success: false, error: error.message }, { status: 400 });
      }
      return json({ success: true, data });
    }

    if (action === "list-order-items") {
      const { data, error } = await loadOrderItemsForOrder(body.orderId);
      if (error) {
        return json({ success: false, error: error.message }, { status: 400 });
      }
      return json({ success: true, data });
    }

    if (action === "get-ticket-type") {
      const { data, error } = await getTicketType(body.ticketTypeId);
      if (error) {
        return json({ success: false, error: error.message }, { status: 400 });
      }
      return json({ success: true, data });
    }

    if (action === "get-order-guest-ids") {
      const { data, error } = await db.rpc("get_order_guest_ids", {
        p_order_id: body.orderId,
      });
      if (error) {
        return json({ success: false, error: error.message }, { status: 400 });
      }
      return json({ success: true, data });
    }

    return json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed",
      },
      { status: 500 }
    );
  }
}
