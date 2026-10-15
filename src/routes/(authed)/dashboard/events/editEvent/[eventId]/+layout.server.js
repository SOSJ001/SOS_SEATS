import { error, redirect } from "@sveltejs/kit";
import { getServerSupabase } from "$lib/server/db";
import { loadOwnedEventForEdit } from "$lib/server/events";
import { PRIVATE_INVITE_TYPE_NAME } from "$lib/server/payments/privateIssue";

/** @param {any} image */
function coverUrl(image) {
  const raw = image?.file_path || image?.url || null;
  if (!raw) return null;
  if (String(raw).startsWith("http")) return raw;
  const { data } = getServerSupabase().storage.from("event_images").getPublicUrl(raw);
  return data?.publicUrl || raw;
}

export async function load({ params, locals }) {
  if (!locals.userId) {
    throw redirect(302, "/");
  }

  const event = await loadOwnedEventForEdit(params.eventId, locals.userId);
  if (!event) {
    throw error(404, "Event not found");
  }

  /** @type {any[]} */
  const sellable = (event.ticket_types || []).filter(
    (/** @type {any} */ t) => t.name !== PRIVATE_INVITE_TYPE_NAME
  );
  const hasPrivateTickets = (event.ticket_types || []).some(
    (/** @type {any} */ t) =>
      t.name === PRIVATE_INVITE_TYPE_NAME && (t.sold_quantity || 0) > 0
  );

  return {
    event: {
      id: event.id,
      updated_at: event.updated_at,
      name: event.name,
      organizer: event.organizer,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      imageUrl: coverUrl(event.image),
      is_free_event: !!event.is_free_event,
      audience_type: event.audience_type,
      event_visibility: event.event_visibility,
      status: event.status,
      ticket_design_config: event.ticket_design_config,
      hasTicketSales: sellable.some((t) => (t.sold_quantity || 0) > 0),
      hasPrivateTickets,
      ticket_types: sellable
        .filter((t) => t.is_active !== false)
        .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")))
        .map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          price: t.price,
          quantity: t.quantity,
          sold_quantity: t.sold_quantity || 0,
        })),
    },
  };
}
