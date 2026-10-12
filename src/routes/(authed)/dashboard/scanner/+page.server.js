import { loadDoorEvents } from "$lib/server/tickets/door";

/** Door events (roadmap 7.2): the organiser's published events to scan. */
export async function load({ locals }) {
  const userId = locals.userId;
  if (!userId) {
    return {
      doorEvents: [],
      summary: { activeEvents: 0, scannedToday: 0, notCheckedIn: 0 },
      loadError: false,
    };
  }

  try {
    const { events, summary } = await loadDoorEvents(userId);
    return { doorEvents: events, summary, loadError: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("Door events load failed:", message);
    return {
      doorEvents: [],
      summary: { activeEvents: 0, scannedToday: 0, notCheckedIn: 0 },
      loadError: true,
    };
  }
}
