import { json } from "@sveltejs/kit";
import {
  updateEventWithDetails,
  uploadEventImageNew,
  supabase,
} from "$lib/supabase.js";
import { parseSession } from "$lib/sessionUtils.js";

export async function PUT({ request, cookies, params }) {
  try {
    const { user_Id, sessionType } = parseSession(cookies);
    const eventId = params.eventId;

    console.log("updateEventApi - Session data:", { user_Id, sessionType });
    console.log("updateEventApi - Event ID:", eventId);

    if (!user_Id) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!eventId) {
      return json(
        { success: false, error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Handle JSON request
    const eventData = await request.json();
    console.log("updateEventApi - Received event data:", eventData);

    let imageId = null;
    let imageBase64 = null;

    // Extract base64 image if present
    if (
      eventData.image &&
      typeof eventData.image === "string" &&
      eventData.image.startsWith("data:")
    ) {
      imageBase64 = eventData.image;
      console.log("updateEventApi - Found base64 image data");
    }

    // Handle image upload if provided
    if (imageBase64) {
      try {
        // Convert base64 to File object
        const base64Response = await fetch(imageBase64);
        const blob = await base64Response.blob();
        const file = new File([blob], "event-image.jpg", { type: blob.type });

        const uploadResult = await uploadEventImageNew(file, user_Id);
        if (uploadResult.success) {
          imageId = uploadResult.image_id;
          console.log(
            "updateEventApi - Successfully uploaded base64 image, image_id:",
            imageId
          );
        } else {
          console.error(
            "updateEventApi - Failed to upload base64 image:",
            uploadResult.error
          );
          return json(
            { success: false, error: "Failed to upload image" },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error("updateEventApi - Error processing base64 image:", error);
        return json(
          { success: false, error: "Failed to process image" },
          { status: 400 }
        );
      }
    } else {
      // If no new image is uploaded, preserve the existing image_id
      // We need to get the current event data to preserve the existing image_id
      const { data: currentEvent, error: fetchError } = await supabase
        .from("events")
        .select("image_id")
        .eq("id", eventId)
        .eq("user_id", user_Id)
        .single();

      if (fetchError) {
        console.error(
          "updateEventApi - Error fetching current event:",
          fetchError
        );
        return json(
          { success: false, error: "Failed to fetch current event data" },
          { status: 400 }
        );
      }

      imageId = currentEvent.image_id;
      console.log("updateEventApi - Preserving existing image_id:", imageId);
    }

    // Prepare event data for database update
    const eventPayload = {
      name: eventData.name,
      description: eventData.description,
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      venue_address: eventData.venue_address,
      category: eventData.category,
      tags: eventData.tags || [],
      organizer: eventData.organizer,
      contact_email: eventData.contact_email,
      website: eventData.website,
      social_media: eventData.social_media || {},
      image_id: imageId,
      is_free_event: eventData.is_free_event || false,
      seating_type: eventData.seating_type || "general",
      total_capacity: parseInt(eventData.total_capacity) || 0,
      audience_type: eventData.audience_type || "all-ages",
      event_visibility: eventData.event_visibility || "public",
      status: eventData.status, // Include status field
      published_at: eventData.published_at, // Include published_at field
      updated_at: new Date().toISOString(),
    };

    // Update the event in the database
    const updateResult = await updateEventWithDetails(
      eventId,
      eventPayload,
      user_Id,
      eventData
    );

    if (updateResult.success) {
      console.log(
        "updateEventApi - Event updated successfully:",
        updateResult.event_id
      );
      return json({
        success: true,
        event_id: updateResult.event_id,
        message: "Event updated successfully",
      });
    } else {
      console.error(
        "updateEventApi - Failed to update event:",
        updateResult.error
      );
      return json(
        { success: false, error: updateResult.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("updateEventApi - Unexpected error:", error);
    return json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
