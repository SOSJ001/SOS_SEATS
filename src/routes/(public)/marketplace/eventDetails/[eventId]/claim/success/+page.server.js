import { error, redirect } from "@sveltejs/kit";
import { getEventById } from "$lib/supabase";
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
  if (order.payment_method !== "free") throw error(404, "Order not found");
  if (order.buyer_id && order.buyer_id !== locals.userId) {
    throw error(403, "Not allowed to view this order");
  }

  const { data: orderItems } = await loadOrderItemsForOrder(orderId);
  const items = orderItems || [];

  const ticketCount =
    items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) || 1;

  const image =
    eventData.images?.[0]?.file_path ||
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop";

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
      ticketCount,
      // HI-FI hardcodes FREE TICKET badge (do not pass GA/VIP names)
      ticketTypes: [{ name: "Free" }],
    },
  };
}
