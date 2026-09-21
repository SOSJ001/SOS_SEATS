import { error } from "@sveltejs/kit";
import { getEventById } from "$lib/supabase";

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  const eventId = params.eventId;
  if (!eventId) {
    throw error(404, "Event not found");
  }

  const eventData = await getEventById(eventId);
  if (!eventData) {
    throw error(404, "Event not found");
  }

  const image =
    eventData.images?.[0]?.file_path ||
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop";

  const ticketTypes = (eventData.ticket_types || []).map((ticket) => ({
    id: ticket.id,
    name: ticket.name,
    price:
      typeof ticket.price === "string"
        ? parseFloat(ticket.price)
        : Number(ticket.price) || 0,
    available_quantity: Math.max(
      0,
      (ticket.quantity || 0) - (ticket.sold_quantity || 0)
    ),
  }));

  const event = {
    id: eventData.id,
    name: eventData.name,
    dateRaw: eventData.date,
    time: eventData.time || "",
    venue: eventData.location || "",
    location: eventData.location || "",
    image,
  };

  return { event, ticketTypes };
}
