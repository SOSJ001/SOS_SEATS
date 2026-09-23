import { loadMyTicketsForBuyer } from "$lib/server/tickets";

/**
 * My Tickets page load (roadmap 6.1 / FR-19–20).
 * Cookie-authz Kit read filtered by buyer_id = locals.userId.
 * Not live auth.uid() RLS (Data Model §7 / API Spec — later Auth JWT cutover).
 */
export async function load({ locals }) {
  const userId = locals.userId || null;
  const userName = locals.userName || "Attendee";

  if (!userId) {
    return {
      userName,
      upcoming: [],
      past: [],
      highlight: null,
      pastHighlight: null,
      stats: { upcoming: 0, past: 0, transfer: 0 },
    };
  }

  try {
    return await loadMyTicketsForBuyer(userId, userName);
  } catch (error) {
    console.error("Error in my-tickets server load:", error);
    return {
      userName,
      upcoming: [],
      past: [],
      highlight: null,
      pastHighlight: null,
      stats: { upcoming: 0, past: 0, transfer: 0 },
    };
  }
}
