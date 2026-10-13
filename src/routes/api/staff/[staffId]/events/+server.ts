/**
 * POST /api/staff/[staffId]/events (roadmap 7.3)
 * body: { eventIds }
 * Assigns more of your upcoming published events; existing ones are skipped.
 */
import type { RequestHandler } from "./$types";
import { assignEvents } from "$lib/server/staff";
import { requireOrganizer, readJson, staffResponse } from "$lib/server/staff/http";

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const organizerId = requireOrganizer(locals);
  if (organizerId instanceof Response) return organizerId;

  const body = await readJson(request);
  if (body instanceof Response) return body;

  return staffResponse(await assignEvents(organizerId, params.staffId, body.eventIds));
};
