/**
 * Rebuild path (roadmap 0.6). Re-exports as-built updateEventApi handler.
 * Param name eventId must match as-built params.eventId.
 * Callers may keep using /updateEventApi/[eventId] for now.
 * 3.2: DELETE uses Kit service-role ownership check.
 */
import { json } from "@sveltejs/kit";
import { deleteOwnedEvent } from "$lib/server/events";

export { PUT } from "../../../updateEventApi/[eventId]/+server.js";

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, locals }) {
  const userId = locals.userId;
  if (!userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const eventId = params.eventId;
  if (!eventId) {
    return json(
      { success: false, error: "Event ID required" },
      { status: 400 }
    );
  }

  const result = await deleteOwnedEvent(eventId, userId);
  if (!result.success) {
    return json({ success: false, error: result.error }, { status: 400 });
  }
  return json({ success: true });
}
