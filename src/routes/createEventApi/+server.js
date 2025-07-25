import { json } from "@sveltejs/kit";
import { createEventWithDetails, uploadEventImageNew } from "$lib/supabase.js";
import { parseSession } from "$lib/sessionUtils.js";

export async function POST({ request, cookies }) {
  try {
    const { user_Id, sessionType } = parseSession(cookies);

    console.log("createEventApi - Session data:", { user_Id, sessionType });

    if (!user_Id) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Handle both FormData and JSON requests
    let eventData;
    let imageFile = null;

    const contentType = request.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      // Handle JSON request from step5
      eventData = await request.json();
      console.log("createEventApi - Received JSON data:", eventData);
    } else {
      // Handle FormData request (legacy)
      const formData = await request.formData();
      eventData = JSON.parse(formData.get("eventData"));
      imageFile = formData.get("image");
      console.log("createEventApi - Received FormData:", eventData);
    }

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
      is_free_event: eventData.is_free_event || false,
      seating_type: eventData.seating_type || "general",
      total_capacity: parseInt(eventData.total_capacity) || 0,
      audience_type: eventData.audience_type || "all-ages",
      event_visibility: eventData.event_visibility || "public",
      status: eventData.status || "draft", // Use the status from step5
      ticket_types: eventData.ticket_types || [],
      venue_sections: eventData.venue_sections || [],
      seating_options: eventData.seating_options || {},
    };

    console.log("createEventApi - Prepared event payload:", eventPayload);
    console.log("createEventApi - Using user ID for event creation:", user_Id);

    // Create event in database
    console.log(
      "createEventApi - Calling createEventWithDetails with payload:",
      eventPayload
    );
    const result = await createEventWithDetails(eventPayload, user_Id);
    console.log("createEventApi - Database result:", result);

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
