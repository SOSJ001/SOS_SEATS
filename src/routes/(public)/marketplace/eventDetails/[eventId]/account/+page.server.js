import { error, redirect } from "@sveltejs/kit";
import { getEventById } from "$lib/supabase";

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals, url }) {
  const eventId = params.eventId;
  if (!eventId) {
    throw error(404, "Event not found");
  }

  const intent = url.searchParams.get("intent") === "claim" ? "claim" : "checkout";
  const target = `/marketplace/eventDetails/${eventId}/${intent}`;

  if (locals.userId) {
    throw redirect(302, target);
  }

  const eventData = await getEventById(eventId);
  if (!eventData) {
    throw error(404, "Event not found");
  }

  const image =
    eventData.images?.[0]?.file_path ||
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop";

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
    intent,
    target,
  };
}
