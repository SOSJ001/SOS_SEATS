import { loadOrganizerScannerEvents } from "$lib/server/events";

export async function load({ locals }) {
  const userId = locals.userId;
  if (!userId) {
    return { events: [], userId: null };
  }

  const events = await loadOrganizerScannerEvents(userId);
  return { events, userId };
}
