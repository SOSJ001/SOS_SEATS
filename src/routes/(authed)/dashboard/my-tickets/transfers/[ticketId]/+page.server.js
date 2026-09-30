import { error } from "@sveltejs/kit";
import {
  loadTransferTicket,
  toReceiptFields,
} from "$lib/server/tickets/transfers";

/**
 * Transfer Ticket form load (roadmap 6.2 / 6.2b, FR-21), HI-FI desktop 55:708 / mobile 36:890.
 * Only VALID tickets for upcoming events held by the session user.
 * receiptBase feeds the Transfer Failed state (FR-21d).
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

  return { ticket, receiptBase: toReceiptFields(ticket) };
}
