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

    // Fetch event data for step4
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

    // Format the event data for step4
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
      ticket_types: event.ticket_types || [],
      venue_sections: event.venue_sections || [],
      seating_options: event.seating_options || {},
      status: event.status || "draft",
      visibility: event.event_visibility || "public",
      registration_required: event.registration_required || false,
      allow_waitlist: event.allow_waitlist || false,
      max_waitlist_size: event.max_waitlist_size || 50,
      registration_deadline: event.registration_deadline || "",
      check_in_opens: event.check_in_opens || "",
      check_in_closes: event.check_in_closes || "",
      allow_refunds: event.allow_refunds || false,
      refund_policy: event.refund_policy || "",
      terms_conditions: event.terms_conditions || "",
      privacy_policy: event.privacy_policy || "",
      email_notifications: event.email_notifications !== false,
      sms_notifications: event.sms_notifications || false,
      reminder_emails: event.reminder_emails !== false,
    };

    console.log("Step4 server - Event data:", event);
    console.log("Step4 server - Formatted event:", formattedEvent);

    return { event: formattedEvent };
  } catch (error) {
    console.error("Error loading event for step4:", error);
    return {
      status: 500,
      error: "Internal server error",
    };
  }
}
