import { json } from "@sveltejs/kit";
import { assertEventOwnedByUser } from "$lib/server/events";
import {
  getGuestForScanner,
  getTicketTypeName,
  getOrdersForEvent,
  getOrderItemsByIds,
  updateOrderItemCheckIn,
  getOrderBuyer,
  loadScanHistoryServer,
} from "$lib/server/tickets";
import { getServerSupabase } from "$lib/server/db";

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
  const userId = locals.userId;
  if (!userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const eventId = url.searchParams.get("eventId");
  const action = url.searchParams.get("action");

  if (!eventId) {
    return json({ success: false, error: "eventId required" }, { status: 400 });
  }

  const owned = await assertEventOwnedByUser(eventId, userId);
  if (!owned) {
    return json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  if (action === "history") {
    const history = await loadScanHistoryServer(eventId, 50);
    return json({ success: true, history });
  }

  return json({ success: false, error: "Unknown action" }, { status: 400 });
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  const userId = locals.userId;
  if (!userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, eventId } = body;

  if (!eventId) {
    return json({ success: false, error: "eventId required" }, { status: 400 });
  }

  const owned = await assertEventOwnedByUser(eventId, userId);
  if (!owned) {
    return json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const db = getServerSupabase();

  if (action === "lookup-guest") {
    const { data, error } = await getGuestForScanner(body.guestId);
    if (error) return json({ success: false, error: error.message }, { status: 400 });
    let ticketTypeName = null;
    if (data?.ticket_type_id) {
      const { data: tt } = await getTicketTypeName(data.ticket_type_id);
      ticketTypeName = tt?.name || null;
    }
    return json({ success: true, guest: data, ticketTypeName });
  }

  if (action === "check-in-guest") {
    const { data, error } = await db.rpc("check_in_guest", {
      p_guest_id: body.guestId,
      p_check_in_location: body.checkInLocation || null,
    });
    if (error) return json({ success: false, error: error.message }, { status: 400 });
    return json({
      success: data?.[0]?.success ?? false,
      message: data?.[0]?.message,
    });
  }

  if (action === "validate-wallet") {
    const { data, error } = await db.rpc("validate_and_check_in_ticket", {
      p_wallet_address: body.walletAddress,
      p_event_id: eventId,
      p_check_in_location: body.checkInLocation || null,
    });
    if (error) return json({ success: false, error: error.message }, { status: 400 });
    if (data && data.length > 0) {
      return json({
        success: data[0].success,
        message: data[0].message,
        ticketInfo: data[0].ticket_info,
      });
    }
    return json({ success: false, message: "No response from database" });
  }

  if (action === "lookup-order-item") {
    const { data: orders } = await getOrdersForEvent(eventId);
    if (!orders?.length) {
      return json({ success: true, item: null });
    }
    const orderIds = orders.map((o) => o.id);
    const { data: items } = await getOrderItemsByIds(orderIds);
    const item = (items || []).find((i) => i.id === body.orderItemId) || null;
    let ticketTypeName = null;
    let buyerName = null;
    if (item?.ticket_type_id) {
      const { data: tt } = await getTicketTypeName(item.ticket_type_id);
      ticketTypeName = tt?.name || null;
    }
    if (item?.order_id) {
      const { data: order } = await getOrderBuyer(item.order_id);
      buyerName = order?.buyer_name || null;
    }
    return json({ success: true, item, ticketTypeName, buyerName });
  }

  if (action === "wallet-preview") {
    const walletAddress = body.walletAddress;
    const { data: orders } = await getOrdersForEvent(eventId);
    const orderIds = (orders || []).map((o) => o.id);
    if (!orderIds.length) {
      return json({
        success: true,
        unscannedCount: 0,
        alreadyCheckedIn: false,
        buyerName: null,
        ticketTypeName: null,
        lastCheckIn: null,
      });
    }

    const { data: items } = await db
      .from("order_items")
      .select("id, order_id, ticket_type_id, check_in_time")
      .eq("current_owner", walletAddress)
      .in("order_id", orderIds);

    const unscanned = (items || []).filter((i) => !i.check_in_time);
    const checkedIn = (items || [])
      .filter((i) => i.check_in_time)
      .sort(
        (a, b) =>
          new Date(b.check_in_time).getTime() -
          new Date(a.check_in_time).getTime()
      );

    let buyerName = "Ticket Holder";
    let ticketTypeName = "Ticket";
    if (unscanned.length > 0) {
      const ticketItem = unscanned[0];
      if (ticketItem.order_id) {
        const { data: order } = await getOrderBuyer(ticketItem.order_id);
        if (order?.buyer_name) buyerName = order.buyer_name;
      }
      if (ticketItem.ticket_type_id) {
        const { data: tt } = await getTicketTypeName(ticketItem.ticket_type_id);
        if (tt?.name) ticketTypeName = tt.name;
      }
    }

    return json({
      success: true,
      unscannedCount: unscanned.length,
      alreadyCheckedIn: unscanned.length === 0 && checkedIn.length > 0,
      lastCheckIn: checkedIn[0]?.check_in_time || null,
      buyerName,
      ticketTypeName,
    });
  }

  if (action === "check-in-order-item") {
    const { data, error } = await updateOrderItemCheckIn(body.orderItemId, {
      check_in_time: new Date().toISOString(),
      check_in_location: body.checkInLocation || null,
      status: "checked-in",
    });
    if (error) return json({ success: false, error: error.message }, { status: 400 });
    return json({ success: true, data });
  }

  return json({ success: false, error: "Unknown action" }, { status: 400 });
}
