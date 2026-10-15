import { json } from "@sveltejs/kit";
import {
  assertEventOwnedByUser,
  decodeEventImageDataUrl,
  loadEventUpdateState,
  updateEventWithDetails,
  uploadEventImage,
  validateEventInput,
} from "$lib/server/events";

/** Partial update: only fields present in the body are validated and written. */
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

    if (!(await assertEventOwnedByUser(eventId, user_Id))) {
      return json(
        { success: false, error: "Event not found or unauthorized" },
        { status: 403 }
      );
    }

    const state = await loadEventUpdateState(eventId, user_Id);
    if (!state) {
      return json(
        { success: false, error: "Event not found or unauthorized" },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const toVisibility =
      body && typeof body === "object" && typeof body.event_visibility === "string"
        ? body.event_visibility
        : undefined;
    if (toVisibility !== undefined && toVisibility !== state.event_visibility) {
      if (toVisibility === "public" && state.hasPrivateTickets) {
        return json(
          {
            success: false,
            error: "This event has private tickets, so it can't be made public",
          },
          { status: 400 }
        );
      }
      if (toVisibility === "private" && state.hasTicketSales) {
        return json(
          {
            success: false,
            error: "Tickets have already been sold for this event, so it can't be made private",
          },
          { status: 400 }
        );
      }
    }

    const validated = validateEventInput(
      body,
      "update",
      state.is_free_event,
      state.event_visibility
    );
    if (!validated.ok) {
      return json({ success: false, error: validated.error }, { status: 400 });
    }
    const { payload, ticketTypes, clearSellableTypes } = validated.value;

    if (
      payload.is_free_event !== undefined &&
      payload.is_free_event !== state.is_free_event &&
      state.hasTicketSales
    ) {
      return json(
        {
          success: false,
          error: "Tickets have already been sold, so the event can't switch between free and paid",
        },
        { status: 400 }
      );
    }

    const wasLive = state.status === "published" || state.status === "live";
    if (payload.status === "draft" && wasLive && state.hasAnySales) {
      return json(
        {
          success: false,
          error: "This event already has tickets out, so it can't go back to draft",
        },
        { status: 400 }
      );
    }
    if (payload.status === "published" && !state.published_at) {
      payload.published_at = new Date().toISOString();
    }

    const image = typeof body.image === "string" ? body.image : "";
    if (image.startsWith("data:")) {
      const decoded = decodeEventImageDataUrl(image);
      if (!decoded.ok) {
        return json({ success: false, error: decoded.error }, { status: 400 });
      }
      const upload = await uploadEventImage(decoded.image, user_Id);
      if (!upload.success) {
        return json({ success: false, error: upload.error }, { status: 500 });
      }
      payload.image_id = upload.image_id;
    }

    const updateResult = await updateEventWithDetails(
      eventId,
      payload,
      user_Id,
      ticketTypes,
      { clearSellableTypes: !!clearSellableTypes }
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
      { status: updateResult.validation ? 400 : 500 }
    );
  } catch (error) {
    console.error("updateEventApi failed", error);
    return json(
      { success: false, error: "Could not save the event" },
      { status: 500 }
    );
  }
}
