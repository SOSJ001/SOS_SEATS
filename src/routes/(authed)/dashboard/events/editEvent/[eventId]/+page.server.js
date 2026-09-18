import { loadOwnedEventForEdit } from "$lib/server/events";

function formatEventForEdit(eventWithImage) {
  return {
    id: eventWithImage.id,
    name: eventWithImage.name,
    date: eventWithImage.date,
    time: eventWithImage.time,
    location: eventWithImage.location,
    venue_address: eventWithImage.venue_address || "",
    description: eventWithImage.description || "",
    category: eventWithImage.category || "",
    tags: eventWithImage.tags || [],
    organizer: eventWithImage.organizer || "",
    contact_email: eventWithImage.contact_email || "",
    website: eventWithImage.website || "",
    social_media: eventWithImage.social_media || {
      facebook: "",
      twitter: "",
      instagram: "",
    },
    is_free_event: eventWithImage.is_free_event || false,
    ticket_types: eventWithImage.ticket_types || [],
    seating_type: eventWithImage.seating_type || "general",
    total_capacity: eventWithImage.total_capacity,
    venue_sections: eventWithImage.venue_sections || [],
    seating_options: eventWithImage.seating_options?.[0] || {
      allow_seat_selection: false,
      max_seats_per_order: 4,
      reserved_seating: false,
      has_seating_chart: false,
    },
    audience_type: eventWithImage.audience_type || "all-ages",
    event_visibility: eventWithImage.event_visibility || "public",
    status: eventWithImage.status,
    image: eventWithImage.image || null,
    image_id: eventWithImage.image_id,
    ticket_design_config: eventWithImage.ticket_design_config || null,
  };
}

export async function load({ params, locals }) {
  const eventId = params.eventId;

  if (!eventId) {
    return { status: 400, error: "Event ID is required" };
  }

  const user_Id = locals.userId;
  if (!user_Id) {
    return { status: 401, error: "Unauthorized" };
  }

  try {
    const event = await loadOwnedEventForEdit(eventId, user_Id);
    if (!event) {
      return { status: 404, error: "Event not found" };
    }

    return { event: formatEventForEdit(event) };
  } catch {
    return { status: 500, error: "Internal server error" };
  }
}
