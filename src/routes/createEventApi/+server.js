import { json } from "@sveltejs/kit";
import { createEventWithDetails, uploadEventImageNew } from "$lib/supabase.js";
import { parseSession } from "$lib/sessionUtils.js";

export async function POST({ request, cookies }) {
  try {
    const { user_Id, sessionType } = parseSession(cookies);

    if (!user_Id) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const eventData = JSON.parse(formData.get("eventData"));
    const imageFile = formData.get("image");

    let imageId = null;

    // Handle image upload if provided
    if (imageFile && imageFile.size > 0) {
      const uploadResult = await uploadEventImageNew(imageFile, user_Id);
      if (uploadResult.success) {
        imageId = uploadResult.image_id;
      } else {
        return json(
          { success: false, error: "Failed to upload image" },
          { status: 400 }
        );
      }
    }

    // Prepare event data for database
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
      is_free_event: eventData.isFreeEvent || false,
      seating_type: eventData.seatingType || "general",
      total_capacity: parseInt(eventData.totalCapacity) || 0,
      audience_type: eventData.audienceType || "all-ages",
      event_visibility: eventData.eventVisibility || "public",
      ticket_types: eventData.ticketTypes || [],
      venue_sections: eventData.venueLayout?.sections || [],
      seating_options: eventData.seatingOptions || {},
    };

    // Create event in database
    const result = await createEventWithDetails(eventPayload, user_Id);

    if (result.success) {
      return json({
        success: true,
        event_id: result.event_id,
        message: "Event created successfully",
      });
    } else {
      return json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Error creating event:", error);
    return json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
