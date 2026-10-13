import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import {
  loadEventScanStats,
  loadRecentScans,
  loadScannerEvent,
  loadScannerEventById,
} from "$lib/server/tickets/door";
import { canScanEvent, findActiveStaffByAuthUser } from "$lib/server/staff";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Door scanner for one event: the owner (7.2) or assigned door staff (7.3). */
export const load: PageServerLoad = async ({ params, locals, depends }) => {
  depends("door:scan");

  const userId = (locals as any)?.userId as string | undefined;
  const isStaff = (locals as any)?.sessionType === "staff";
  const eventId = String(params.eventId || "");

  // Same 404 for bad, missing, not-owned and not-assigned ids, so ids can't be probed
  if (!userId || !UUID_RE.test(eventId)) throw error(404, "Event not found");

  let event;
  let staffContact = null;
  if (isStaff) {
    if (!(await canScanEvent(eventId, userId, "staff"))) {
      throw error(404, "Event not found");
    }
    [event, staffContact] = await Promise.all([
      loadScannerEventById(eventId),
      findActiveStaffByAuthUser(userId),
    ]);
  } else {
    event = await loadScannerEvent(eventId, userId);
  }
  if (!event) throw error(404, "Event not found");

  const [stats, recent] = await Promise.all([
    loadEventScanStats(eventId),
    loadRecentScans(eventId, 8),
  ]);

  return {
    event,
    stats,
    recent,
    role: isStaff ? ("staff" as const) : ("organiser" as const),
    backHref: isStaff ? "/dashboard/staff" : "/dashboard/scanner",
    backLabel: isStaff ? "My events" : "Back to Door events",
    staffContact,
  };
};
