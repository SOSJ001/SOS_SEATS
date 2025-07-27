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
    const { valid, user_Id, sessionType } = validateSession(cookies);

    if (!valid) {
      return {
        status: 401,
        error: "Unauthorized",
      };
    }

    // Fetch event data for step2
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(`*`)
      .eq("id", eventId)
      .eq("user_id", user_Id)
      .single();

    if (eventError || !event) {
      return {
        status: 404,
        error: "Event not found",
      };
    }

    // Format the event data for step2
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
      image: event.image || null,
      image_id: event.image_id,
    };

    console.log("Step2 server - Event data:", event);
    console.log("Step2 server - Formatted event:", formattedEvent);

    return { event: formattedEvent };
  } catch (error) {
    console.error("Error loading event for step2:", error);
    return {
      status: 500,
      error: "Internal server error",
    };
  }
}
