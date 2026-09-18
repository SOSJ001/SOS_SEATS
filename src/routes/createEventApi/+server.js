import { json } from "@sveltejs/kit";
import {
  createEventWithDetails,
  uploadEventImage,
} from "$lib/server/events";

export async function POST({ request, locals }) {
  try {
    const user_Id = locals.userId;

    if (!user_Id) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let eventData;
    let imageFile = null;
    let imageBase64 = null;

    const contentType = request.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      eventData = await request.json();
      if (
        eventData.image &&
        typeof eventData.image === "string" &&
        eventData.image.startsWith("data:")
      ) {
        imageBase64 = eventData.image;
      }
    } else {
      const formData = await request.formData();
      eventData = JSON.parse(formData.get("eventData"));
      imageFile = formData.get("image");
    }

    let imageId = null;

    if (imageFile && imageFile.size > 0) {
      const uploadResult = await uploadEventImage(imageFile, user_Id);
      if (uploadResult.success) {
        imageId = uploadResult.image_id;
      } else {
        return json(
          { success: false, error: "Failed to upload image" },
          { status: 400 }
        );
      }
    } else if (imageBase64) {
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
      status: eventData.status || "draft",
      ticket_design_config: eventData.ticket_design_config || null,
      ticket_types: eventData.ticket_types || [],
      venue_sections: eventData.venue_sections || [],
      seating_options: eventData.seating_options || {},
    };

    const result = await createEventWithDetails(eventPayload, user_Id);
    if (result.success) {
      return json({
        success: true,
        event_id: result.event_id,
        message: "Event created successfully",
      });
    }
    return json({ success: false, error: result.error }, { status: 400 });
  } catch {
    return json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
