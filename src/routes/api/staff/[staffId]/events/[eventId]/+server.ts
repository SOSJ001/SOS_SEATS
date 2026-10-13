/**
 * DELETE /api/staff/[staffId]/events/[eventId] (roadmap 7.3)
 * Unassigns one event from a staff member.
 */
import type { RequestHandler } from "./$types";
import { unassignEvent } from "$lib/server/staff";
import { requireOrganizer, staffResponse } from "$lib/server/staff/http";

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const organizerId = requireOrganizer(locals);
  if (organizerId instanceof Response) return organizerId;

  return staffResponse(await unassignEvent(organizerId, params.staffId, params.eventId));
};
