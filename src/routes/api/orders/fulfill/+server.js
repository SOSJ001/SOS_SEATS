import { json } from "@sveltejs/kit";
import {
  loadOrderItemsForOrder,
  updateOrderItem,
  insertGuests,
  getTicketType,
} from "$lib/server/tickets";
import { getServerSupabase } from "$lib/server/db";

/** Confirmation / post-purchase fulfill helpers (service role). */
/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { action } = body;
    const db = getServerSupabase();

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

    if (action === "update-order-item") {
      const { data, error } = await updateOrderItem(body.itemId, body.updates);
      if (error) {
        return json({ success: false, error: error.message }, { status: 400 });
      }
      return json({ success: true, data });
    }

    if (action === "insert-guests") {
      const { data, error } = await insertGuests(body.rows || []);
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
