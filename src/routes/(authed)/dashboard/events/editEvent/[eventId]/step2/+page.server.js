import { error } from "@sveltejs/kit";
import { supabase } from "$lib/supabase.js";
import { validateSession } from "$lib/sessionUtils.js";

export async function load({ url, cookies, params }) {
  try {
    const { user_Id, sessionType } = validateSession(cookies);
    const eventId = params.eventId;

    console.log("Step2 server - Loading event data for eventId:", eventId);
    console.log("Step2 server - User ID:", user_Id);

    if (!user_Id) {
      throw error(401, "Unauthorized");
    }

    if (!eventId) {
      throw error(400, "Event ID is required");
    }

    // Fetch event data
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("user_id", user_Id)
      .single();

    if (eventError) {
      console.error("Step2 server - Error fetching event:", eventError);
      throw error(404, "Event not found");
    }

    // Fetch image data separately if image_id exists
    let imageData = null;
    if (event.image_id) {
      const { data: image, error: imageError } = await supabase
        .from("images")
        .select("*")
        .eq("id", event.image_id)
        .single();

      if (!imageError && image) {
        imageData = image;
        console.log("Step2 server - Image data loaded:", imageData);
      }
    }

    // Combine event and image data
    const eventWithImage = {
      ...event,
      image: imageData
    };

    console.log("Step2 server - Event data loaded:", eventWithImage);

    return {
      event: eventWithImage,
    };
  } catch (err) {
    console.error("Step2 server - Unexpected error:", err);
    if (err.status) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
}
