import {
  emptyTransfersPayload,
  loadTransfersPage,
} from "$lib/server/tickets/transfers";

/**
 * Ticket Transfers page load (roadmap 6.2 / FR-21).
 * Same cookie-authz pattern as My Tickets: buyer_id = locals.userId.
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
