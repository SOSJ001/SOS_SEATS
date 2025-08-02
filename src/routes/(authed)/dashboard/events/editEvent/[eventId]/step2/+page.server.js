import { error } from "@sveltejs/kit";
import { supabase } from "$lib/supabase.js";
import { validateSession } from "$lib/sessionUtils.js";

export async function load({ url, cookies, params }) {
  try {
    const { user_Id, sessionType } = validateSession(cookies);
    const eventId = params.eventId;

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
        }
    }

    // Combine event and image data
    const eventWithImage = {
      ...event,
      image: imageData
    };

    return {
      event: eventWithImage,
    };
  } catch (err) {
    if (err.status) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
}
