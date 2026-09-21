import { error } from "@sveltejs/kit";
import { getEventById, loadPublicEvents } from "$lib/supabase";

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

  const isFreeEvent =
    eventData.is_free_event ||
    (Array.isArray(eventData.ticket_types) &&
      eventData.ticket_types.length > 0 &&
      eventData.ticket_types.every((ticket) => {
        const price =
          typeof ticket.price === "string"
            ? parseFloat(ticket.price)
            : ticket.price;
        return price === 0 || price === null || price === undefined;
      }));

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
    description: ticket.description || "",
    features: ticket.benefits || [],
    available_quantity: Math.max(
      0,
      (ticket.quantity || 0) - (ticket.sold_quantity || 0)
    ),
  }));

  const event = {
    id: eventData.id,
    name: eventData.name,
    date: eventData.date
      ? new Date(eventData.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
    dateRaw: eventData.date,
    venue: eventData.location || "",
    location: eventData.location || "",
    image,
    description: eventData.description || "",
    time: eventData.time || "",
    organizer: eventData.organizer || "",
    category: eventData.category || "General",
    total_capacity: eventData.total_capacity,
    ticket_types: ticketTypes,
    venue_sections: eventData.venue_sections || [],
    seating_options: eventData.seating_options?.[0] || {
      max_seats_per_order: 10,
    },
    is_free_event: !!isFreeEvent,
  };

  const allPublic = (await loadPublicEvents()) || [];
  const relatedEvents = allPublic
    .filter((e) => e.id !== eventId)
    .slice(0, 3)
    .map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      time: e.time,
      image: e.image,
      price: e.price,
      is_free_event: e.price === "Free" || e.is_free_event,
    }));

  return { event, ticketTypes, relatedEvents };
}
