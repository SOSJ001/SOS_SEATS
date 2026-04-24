import { json, type RequestEvent } from "@sveltejs/kit";
import { validateSession } from "$lib/sessionUtils.js";

export type SessionResult =
  | { ok: true; user_Id: string; sessionType: string | null }
  | { ok: false; response: Response };

export function requireSessionOr401(event: RequestEvent): SessionResult {
  const { valid, user_Id, sessionType } = validateSession(event.cookies);
  if (!valid || !user_Id) {
    return {
      ok: false,
      response: json(
        { success: false as const, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { ok: true, user_Id, sessionType };
}
