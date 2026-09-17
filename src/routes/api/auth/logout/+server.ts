/**
 * Rebuild path (roadmap 0.6 / 2.1). Harden cookie delete flags.
 */
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { clearUserSessionCookie } from "$lib/server/auth";

export const POST: RequestHandler = async ({ cookies }) => {
  clearUserSessionCookie(cookies);
  return json({}, { status: 201 });
};
