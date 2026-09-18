import { json } from "@sveltejs/kit";
import {
  updateEventWithDetails,
  uploadEventImage,
  getEventImageId,
} from "$lib/server/events";

export async function PUT({ request, locals, params }) {
  try {
    const user_Id = locals.userId;
    const eventId = params.eventId;

    if (!user_Id) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!eventId) {
      return json(
        { success: false, error: "Event ID is required" },
        { status: 400 }
      );
    }

    const eventData = await request.json();
    let imageId = null;
    let imageBase64 = null;

    if (
      eventData.image &&
      typeof eventData.image === "string" &&
      eventData.image.startsWith("data:")
    ) {
      imageBase64 = eventData.image;
    }

    if (imageBase64) {
      try {
        const base64Response = await fetch(imageBase64);
        const blob = await base64Response.blob();
        const file = new File([blob], "event-image.jpg", { type: blob.type });

        const uploadResult = await uploadEventImage(file, user_Id);
        if (uploadResult.success) {
          imageId = uploadResult.image_id;
        } else {
          return json(
            { success: false, error: "Failed to upload image" },
            { status: 400 }
          );
        }
      } catch {
        return json(
          { success: false, error: "Failed to process image" },
          { status: 400 }
        );
      }
    } else {
      imageId = await getEventImageId(eventId, user_Id);
      if (imageId === null && eventData.image_id) {
        imageId = eventData.image_id;
      }
    }

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
      status: eventData.status,
      published_at: eventData.published_at,
      ticket_design_config: eventData.ticket_design_config || null,
      updated_at: new Date().toISOString(),
    };

    const updateResult = await updateEventWithDetails(
      eventId,
      eventPayload,
      user_Id,
      eventData
    );

    if (updateResult.success) {
      return json({
        success: true,
        event_id: updateResult.event_id,
        message: "Event updated successfully",
      });
    }
    return json(
      { success: false, error: updateResult.error },
      { status: 400 }
    );
  } catch {
    return json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
