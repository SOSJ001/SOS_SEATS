import { supabase } from "$lib/supabase.js";
import { validateSession } from "$lib/sessionUtils.js";

export async function load({ params, cookies }) {
  const eventId = params.eventId;

  if (!eventId) {
    return {
      status: 400,
      error: "Event ID is required",
    };
  }

  try {
    // Get the current user from session cookies
    const { valid, user_Id, sessionType } = validateSession(cookies);

    if (!valid || !user_Id) {
      return {
        status: 401,
        error: "Unauthorized",
      };
    }

    // Fetch the specific event with all its details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        `
        *,
        ticket_types(*),
        venue_sections(*),
        seating_options(*)
      `
      )
      .eq("id", eventId)
      .eq("user_id", user_Id)
      .single();

    if (eventError) {
      console.error("Error fetching event:", eventError);
      return {
        status: 404,
        error: "Event not found",
      };
    }

    if (!event) {
      return {
        status: 404,
        error: "Event not found",
      };
    }

    // Load image data if event has an image_id
    let eventWithImage = event;
    if (event.image_id) {
      try {
        const { data: imageData, error: imageError } = await supabase
          .from("images")
          .select("*")
          .eq("id", event.image_id)
          .single();

        if (!imageError && imageData) {
          eventWithImage = { ...event, image: imageData };
        }
      } catch (imageError) {
        console.error("Error loading image for event:", imageError);
      }
    }

    // Format the event data for the edit flow
    const formattedEvent = {
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
    };

    return {
      event: formattedEvent,
    };
  } catch (error) {
    console.error("Server error:", error);
    return {
      status: 500,
      error: "Internal server error",
    };
  }
}
