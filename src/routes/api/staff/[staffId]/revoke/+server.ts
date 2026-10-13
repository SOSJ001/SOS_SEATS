/**
 * POST /api/staff/[staffId]/revoke (roadmap 7.3)
 * Permanent: revokes the staff row and bans the login.
 */
import type { RequestHandler } from "./$types";
import { revokeStaff } from "$lib/server/staff";
import { requireOrganizer, staffResponse } from "$lib/server/staff/http";

export const POST: RequestHandler = async ({ params, locals }) => {
  const organizerId = requireOrganizer(locals);
  if (organizerId instanceof Response) return organizerId;

  return staffResponse(await revokeStaff(organizerId, params.staffId));
};
