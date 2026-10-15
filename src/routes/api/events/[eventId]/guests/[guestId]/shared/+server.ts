import { json } from "@sveltejs/kit";
import { getServerSupabase } from "$lib/server/db";
import { assertEventOwnedByUser } from "$lib/server/events";
import { isPrivateIssuedGuest } from "$lib/server/payments";

const MAX_NAME_LENGTH = 80;

function displayName(firstName: string, lastName: string) {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return firstName || lastName || "Guest";
}

/**
 * POST /api/events/[eventId]/guests/[guestId]/shared
 * body: { via: "download" | "share", name?: string }
 * Records that the organiser downloaded or shared a private ticket.
 */
/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request, locals }) {
  const userId = locals.userId;
  if (!userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, guestId } = params;
  if (!eventId || !guestId) {
    return json(
      { success: false, error: "Event and guest ID required" },
      { status: 400 }
    );
  }

  const owned = await assertEventOwnedByUser(eventId, userId);
  if (!owned) {
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

  const via = body?.via;
  if (via !== "download" && via !== "share") {
    return json(
      { success: false, error: "via must be download or share" },
      { status: 400 }
    );
  }

  const rawName =
    typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  if (rawName.length > MAX_NAME_LENGTH) {
    return json(
      { success: false, error: `Name must be ${MAX_NAME_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  const db = getServerSupabase();
  const { data: guest, error: loadError } = await db
    .from("guests")
    .select(
      "id, first_name, last_name, status, special_requirements, share_count, ticket_types(name)"
    )
    .eq("id", guestId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (loadError || !guest) {
    return json({ success: false, error: "Ticket not found" }, { status: 404 });
  }

  const ticketType = Array.isArray(guest.ticket_types)
    ? guest.ticket_types[0]?.name
    : (guest.ticket_types as { name?: string } | null)?.name;

  const isPrivate = isPrivateIssuedGuest({
    status: guest.status ?? undefined,
    ticketType: ticketType || undefined,
    special_requirements: guest.special_requirements,
  });
  if (!isPrivate) {
    return json(
      { success: false, error: "Only private tickets can be marked as shared" },
      { status: 400 }
    );
  }

  let firstName = guest.first_name || "";
  let lastName = guest.last_name || "";
  if (rawName) {
    const [first, ...rest] = rawName.split(" ");
    firstName = first;
    lastName = rest.join(" ");
  }

  const sharedAt = new Date().toISOString();
  const shareCount = (Number(guest.share_count) || 0) + 1;

  const { error: updateError } = await db
    .from("guests")
    .update({
      first_name: firstName,
      last_name: lastName,
      shared_at: sharedAt,
      shared_via: via,
      share_count: shareCount,
    })
    .eq("id", guestId)
    .eq("event_id", eventId);

  if (updateError) {
    return json(
      { success: false, error: "Could not save share status" },
      { status: 500 }
    );
  }

  return json({
    success: true,
    name: displayName(firstName, lastName),
    sharedAt,
    sharedVia: via,
    shareCount,
  });
}
