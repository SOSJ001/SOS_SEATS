/**
 * Shared /api/staff/* plumbing (roadmap 7.3): organiser-only guard,
 * JSON body read and the API Spec envelope { success, ... }.
 */
import { json } from "@sveltejs/kit";
import type { StaffResult } from "./index";

/** The organiser id, or a 401/403 response. */
export function requireOrganizer(locals: App.Locals): string | Response {
  if (!locals.userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (locals.sessionType === "staff") {
    return json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  return locals.userId;
}

export async function readJson(request: Request): Promise<Record<string, unknown> | Response> {
  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body;
  } catch {
    // fall through
  }
  return json({ success: false, error: "Invalid JSON body" }, { status: 400 });
}

export function staffResponse<T>(result: StaffResult<T>, okStatus = 200): Response {
  if (!result.ok) {
    const { status, error, field } = result;
    return json(
      field ? { success: false, error, field } : { success: false, error },
      { status }
    );
  }
  const { ok: _ok, ...rest } = result;
  return json({ success: true, ...rest }, { status: okStatus });
}
