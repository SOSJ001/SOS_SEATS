import { error } from "@sveltejs/kit";
import { loadTransferTicket } from "$lib/server/tickets/transfers";

/**
 * Transfer Ticket form load (roadmap 6.2 / FR-21), HI-FI desktop 55:708 / mobile 36:890.
 * Only VALID tickets for upcoming events owned by the session user.
 */
export async function load({ locals, params }) {
  const userId = locals.userId || null;
  const userName = locals.userName || "Attendee";

  const ticket = userId
    ? await loadTransferTicket(userId, userName, params.ticketId)
    : null;

  if (!ticket) {
    throw error(404, "This ticket can't be transferred");
  }

  return { ticket };
}
