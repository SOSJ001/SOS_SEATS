import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import {
  loadEventScanStats,
  loadRecentScans,
  loadScannerEvent,
} from "$lib/server/tickets/door";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Organiser scanner for one owned event (roadmap 7.2). 7.3 adds assigned staff. */
export const load: PageServerLoad = async ({ params, locals, depends }) => {
  depends("door:scan");

  const userId = (locals as any)?.userId as string | undefined;
  const eventId = String(params.eventId || "");

  // Same 404 for bad, missing and not-owned ids, so ids can't be probed
  if (!userId || !UUID_RE.test(eventId)) throw error(404, "Event not found");
  const event = await loadScannerEvent(eventId, userId);
  if (!event) throw error(404, "Event not found");

  const [stats, recent] = await Promise.all([
    loadEventScanStats(eventId),
    loadRecentScans(eventId, 8),
  ]);

  return {
    event,
    stats,
    recent,
    role: "organiser" as const,
    backHref: "/dashboard/scanner",
  };
};
