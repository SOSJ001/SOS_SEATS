/**
 * POST /api/staff/invite (roadmap 7.3 / FR-42)
 * body: { contact, password, eventIds }
 * Creates a staff login, or adds events when the contact is already your staff.
 */
import type { RequestHandler } from "./$types";
import { inviteStaff } from "$lib/server/staff";
import { requireOrganizer, readJson, staffResponse } from "$lib/server/staff/http";

export const POST: RequestHandler = async ({ request, locals }) => {
  const organizerId = requireOrganizer(locals);
  if (organizerId instanceof Response) return organizerId;

  const body = await readJson(request);
  if (body instanceof Response) return body;

  const result = await inviteStaff({
    organizerId,
    contact: body.contact,
    password: body.password,
    eventIds: body.eventIds,
  });
  return staffResponse(result, result.ok && !result.alreadyStaff ? 201 : 200);
};
