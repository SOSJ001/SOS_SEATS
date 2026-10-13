/**
 * POST /api/staff/[staffId]/password (roadmap 7.3)
 * body: { password }  (at least 8 characters)
 */
import type { RequestHandler } from "./$types";
import { setStaffPassword } from "$lib/server/staff";
import { requireOrganizer, readJson, staffResponse } from "$lib/server/staff/http";

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const organizerId = requireOrganizer(locals);
  if (organizerId instanceof Response) return organizerId;

  const body = await readJson(request);
  if (body instanceof Response) return body;

  return staffResponse(await setStaffPassword(organizerId, params.staffId, body.password));
};
