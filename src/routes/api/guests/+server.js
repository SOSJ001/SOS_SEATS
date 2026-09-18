import { json } from "@sveltejs/kit";
import { addGuestToOwnedEvent, loadEventTicketTypes } from "$lib/server/events";

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  const userId = locals.userId;
  if (!userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { eventId, guestData } = body;
  if (!eventId || !guestData) {
    return json(
      { success: false, error: "eventId and guestData required" },
      { status: 400 }
    );
  }

  const result = await addGuestToOwnedEvent(eventId, userId, guestData);
  if (!result.success) {
    return json({ success: false, error: result.error }, { status: 400 });
  }
  return json({ success: true, data: result.data });
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
  const userId = locals.userId;
  if (!userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const eventId = url.searchParams.get("eventId");
  if (!eventId) {
    return json({ success: false, error: "eventId required" }, { status: 400 });
  }

  const result = await loadEventTicketTypes(eventId, userId);
  if (!result.success) {
    return json({ success: false, error: result.error }, { status: 400 });
  }
  return json({ success: true, data: result.data });
}
