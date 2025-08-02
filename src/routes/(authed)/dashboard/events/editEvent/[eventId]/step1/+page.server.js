import { validateSession } from "$lib/sessionUtils.js";
import { supabase } from "$lib/supabase.js";

export async function load({ params, cookies }) {
  try {
    const { user_Id } = await validateSession(cookies);

    if (!user_Id) {
      return {
        error: "Unauthorized",
      };
    }

    const { data: event, error } = await supabase
      .from("events")
      .select(
        `
        *,
        ticket_types(*),
        venue_sections(*),
        seating_options(*)
      `
      )
      .eq("id", params.eventId)
      .eq("user_id", user_Id)
      .single();

    if (error) {
      return {
        error: "Failed to load event data",
      };
    }

    if (!event) {
      return {
        error: "Event not found",
      };
    }

    // Format the event data for the frontend
    const formattedEvent = {
      id: event.id,
      name: event.name,
      date: event.date,
      time: event.time,
      location: event.location,
      venue_address: event.venue_address || "",
      description: event.description || "",
      category: event.category || "",
      tags: event.tags || [],
      organizer: event.organizer || "",
      contact_email: event.contact_email || "",
      website: event.website || "",
      social_media: event.social_media || {
        facebook: "",
        twitter: "",
        instagram: "",
      },
      is_free_event: event.is_free_event || false,
      ticket_types: event.ticket_types || [],
      seating_type: event.seating_type || "general",
      total_capacity: event.total_capacity,
      venue_sections: event.venue_sections || [],
      seating_options: event.seating_options?.[0] || {
        allow_seat_selection: false,
        max_seats_per_order: 4,
        reserved_seating: false,
        has_seating_chart: false,
      },
      audience_type: event.audience_type || "all-ages",
      event_visibility: event.event_visibility || "public",
    };

    // Load image data if image_id exists
    if (event.image_id) {
      const { data: imageData } = await supabase
        .from("images")
        .select("*")
        .eq("id", event.image_id)
        .single();

      if (imageData) {
        formattedEvent.image = {
          id: imageData.id,
          file_path: imageData.file_path,
          file_name: imageData.file_name,
        };
        formattedEvent.imagePreview = imageData.file_path;
      }
    }

    return {
      event: formattedEvent,
    };
  } catch (error) {
    return {
      error: "Failed to load event data",
    };
  }
}
