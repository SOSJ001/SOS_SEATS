import { supabase } from "$lib/supabase.js";
import { validateSession } from "$lib/sessionUtils.js";

export async function load({ params, cookies }) {
  const eventId = params.eventId;

  if (!eventId) {
    return {
      status: 400,
      error: "Event ID is required"
    };
  }

  try {
    const { valid, user_Id, sessionType } = validateSession(cookies);
    
    if (!valid) {
      return {
        status: 401,
        error: "Unauthorized"
      };
    }

    // Fetch event data for step3
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(`
        *,
        ticket_types(*),
        venue_sections(*),
        seating_options(*)
      `)
      .eq("id", eventId)
      .eq("user_id", user_Id)
      .single();

    if (eventError || !event) {
      return {
        status: 404,
        error: "Event not found"
      };
    }

    // Format the event data for step3
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
      seating_type: event.seating_type || "general",
      total_capacity: event.total_capacity || null,
      ticket_types: event.ticket_types || [
        {
          name: "General Admission",
          description: "",
          price: 0.0,
          quantity: null,
          benefits: [],
        },
      ],
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

    return { event: formattedEvent };
  } catch (error) {
    return {
      status: 500,
      error: "Internal server error"
    };
  }
} 