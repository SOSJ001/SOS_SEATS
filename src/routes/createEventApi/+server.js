import { json } from "@sveltejs/kit";
import {
  createEventWithDetails,
  decodeEventImageDataUrl,
  uploadEventImage,
  validateEventInput,
} from "$lib/server/events";

export async function POST({ request, locals }) {
  try {
    const user_Id = locals.userId;

    if (!user_Id) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let eventData;
    try {
      eventData = await request.json();
    } catch {
      return json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const validated = validateEventInput(eventData, "create");
    if (!validated.ok) {
      return json({ success: false, error: validated.error }, { status: 400 });
    }
    const { payload, ticketTypes = [] } = validated.value;

    let imageId = null;
    const image = typeof eventData.image === "string" ? eventData.image : "";
    if (image.startsWith("data:")) {
      const decoded = decodeEventImageDataUrl(image);
      if (!decoded.ok) {
        return json({ success: false, error: decoded.error }, { status: 400 });
      }
      const upload = await uploadEventImage(decoded.image, user_Id);
      if (!upload.success) {
        return json({ success: false, error: upload.error }, { status: 500 });
      }
      imageId = upload.image_id;
    }

    const eventPayload = {
      ...payload,
      tags: payload.tags || [],
      social_media: payload.social_media || {},
      image_id: imageId,
      total_capacity: ticketTypes.reduce((sum, t) => sum + t.quantity, 0),
      ticket_types: ticketTypes.map((t) => ({ ...t, benefits: [] })),
      venue_address: null,
      seating_type: "general",
      venue_sections: [],
      seating_options: { max_seats_per_order: 1 },
    };

    const result = await createEventWithDetails(eventPayload, user_Id);
    if (result.success) {
      return json({
        success: true,
        event_id: result.event_id,
        message: "Event created successfully",
      });
    }
    return json({ success: false, error: result.error }, { status: 500 });
  } catch (error) {
    console.error("createEventApi failed", error);
    return json(
      { success: false, error: "Could not save the event" },
      { status: 500 }
    );
  }
}
