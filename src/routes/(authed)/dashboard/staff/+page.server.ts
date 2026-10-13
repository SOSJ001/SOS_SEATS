import type { PageServerLoad } from "./$types";
import { loadStaffDoorEvents } from "$lib/server/staff";

const EMPTY_SUMMARY = { activeEvents: 0, scannedToday: 0, notCheckedIn: 0 };

/** Staff landing (FR-43): the signed-in staff member's assigned events. */
export const load: PageServerLoad = async ({ locals }) => {
  const userId = (locals as any)?.userId as string | undefined;
  if (!userId) {
    return { doorEvents: [], summary: EMPTY_SUMMARY, staffContact: null, loadError: false };
  }

  try {
    const result = await loadStaffDoorEvents(userId);
    // No active login (revoked while signed in): nothing to scan.
    if (!result) {
      return { doorEvents: [], summary: EMPTY_SUMMARY, staffContact: null, loadError: false };
    }
    return {
      // Past events are no longer scannable at the door, so the landing hides them.
      doorEvents: result.events.filter((e) => e.phase !== "past"),
      summary: result.summary,
      staffContact: result.staffContact,
      loadError: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("Staff door events load failed:", message);
    return { doorEvents: [], summary: EMPTY_SUMMARY, staffContact: null, loadError: true };
  }
};
