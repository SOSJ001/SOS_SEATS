import {
  emptyTransfersPayload,
  loadTransfersPage,
} from "$lib/server/tickets/transfers";

/**
 * Ticket Transfers page load (roadmap 6.2 / 6.2b, FR-21).
 * Same cookie-authz pattern as My Tickets: owner_user_id = locals.userId; history from ticket_transfers.
 */
export async function load({ locals }) {
  const userId = locals.userId || null;
  const userName = locals.userName || "Attendee";

  if (!userId) return emptyTransfersPayload(userName);

  try {
    return await loadTransfersPage(userId, userName);
  } catch (error) {
    console.error("Error in transfers server load:", error);
    return emptyTransfersPayload(userName);
  }
}
