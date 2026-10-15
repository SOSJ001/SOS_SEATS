import { error, redirect } from "@sveltejs/kit";
import { getEventById } from "$lib/supabase";
import { getActiveHoldCounts } from "$lib/server/payments";

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
  const eventId = params.eventId;
  if (!eventId) {
    throw error(404, "Event not found");
  }

  // FR-33 (Option A): any authenticated session may checkout; MM phone is a form field
  if (!locals.userId) {
    throw redirect(302, `/marketplace/eventDetails/${eventId}/account?intent=checkout`);
  }

  const eventData = await getEventById(eventId);
  if (!eventData) {
    throw error(404, "Event not found");
  }
  eventData.ticket_types = (eventData.ticket_types || []).filter(
    (/** @type {any} */ ticket) => ticket.is_active !== false
  );

  const image = eventData.images?.[0]?.file_path || null;
  const held = await getActiveHoldCounts(eventId, locals.userId);

  const ticketTypes = (eventData.ticket_types || []).map((ticket) => ({
    id: ticket.id,
    name: ticket.name,
    price:
      typeof ticket.price === "string"
        ? parseFloat(ticket.price)
        : Number(ticket.price) || 0,
    available_quantity: Math.max(
      0,
      (ticket.quantity || 0) - (ticket.sold_quantity || 0) - (held[ticket.id] || 0)
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

  return {
    event,
    ticketTypes,
    userName: locals.userName ?? null,
  };
}
