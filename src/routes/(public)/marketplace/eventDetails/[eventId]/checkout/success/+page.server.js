import { error, redirect } from "@sveltejs/kit";
import { getEventById } from "$lib/supabase";
import { getServerSupabase } from "$lib/server/db";
import { getOrderById } from "$lib/server/wallet";
import { loadOrderItemsForOrder } from "$lib/server/tickets";

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals, url }) {
  if (!locals.userId) {
    const next = encodeURIComponent(url.pathname + url.search);
    throw redirect(302, `/sign-in?next=${next}`);
  }

  const eventId = params.eventId;
  const orderId = url.searchParams.get("orderId");
  if (!eventId) throw error(404, "Event not found");
  if (!orderId) throw error(400, "Order ID is required");

  const eventData = await getEventById(eventId);
  if (!eventData) throw error(404, "Event not found");

  const { data: order, error: orderError } = await getOrderById(orderId);
  if (orderError || !order) throw error(404, "Order not found");
  if (order.event_id !== eventId) throw error(404, "Order not found");
  if (order.buyer_id && order.buyer_id !== locals.userId) {
    throw error(403, "Not allowed to view this order");
  }

  const { data: orderItems } = await loadOrderItemsForOrder(orderId);
  const items = orderItems || [];

  const typeIds = [
    ...new Set(items.map((item) => item.ticket_type_id).filter(Boolean)),
  ];
  /** @type {Record<string, string>} */
  const typeNameById = {};
  if (typeIds.length > 0) {
    const db = getServerSupabase();
    const { data: types } = await db
      .from("ticket_types")
      .select("id, name")
      .in("id", typeIds);
    for (const t of types || []) {
      typeNameById[t.id] = t.name;
    }
  }

  const ticketCount =
    items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) || 1;

  const ticketTypeNames = [
    ...new Set(
      items
        .map(
          (item) =>
            item.ticket_type_name || typeNameById[item.ticket_type_id] || null
        )
        .filter(Boolean)
    ),
  ];
  const ticketTypes =
    ticketTypeNames.length > 0
      ? ticketTypeNames.map((name) => ({ name }))
      : eventData.ticket_types?.slice(0, 1).map((t) => ({ name: t.name })) ||
        [{ name: "Ticket" }];

  const image =
    eventData.images?.[0]?.file_path ||
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop";

  const amount =
    typeof order.total_amount === "string"
      ? parseFloat(order.total_amount)
      : Number(order.total_amount) || 0;

  return {
    event: {
      id: eventData.id,
      name: eventData.name,
      dateRaw: eventData.date,
      time: eventData.time || "",
      venue: eventData.location || "",
      location: eventData.location || "",
      image,
    },
    order: {
      id: order.id,
      orderNumber: order.order_number || order.id,
      amount,
      paymentMethod: paymentMethodLabel(order.payment_method),
      timestamp: formatTimestamp(
        order.created_at ? new Date(order.created_at) : new Date()
      ),
      ticketCount,
      ticketTypes,
    },
  };
}

function paymentMethodLabel(method) {
  if (method === "orange_money") return "Orange Money";
  if (method === "afrimoney") return "Afrimoney";
  if (method === "free") return "Free";
  return method || "Mobile Money";
}

function formatTimestamp(d) {
  if (Number.isNaN(d.getTime())) return "";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  const datePart = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${datePart} · ${hh}:${mm}`;
}
