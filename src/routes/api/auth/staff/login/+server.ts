/**
 * POST /api/auth/staff/login: door staff session (roadmap 7.3 / FR-43).
 * Body: { identifier, password }. Identifier is one email or phone value.
 */
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  loginWithPassword,
  setUserSessionCookie,
  AUTH_SERVICE_UNREACHABLE,
} from "$lib/server/auth";
import { findActiveStaffLogin } from "$lib/server/staff";

// Same message for unknown, revoked, banned and wrong password, so contacts can't be probed.
const INVALID_LOGIN = "Invalid email, phone or password.";

export const POST: RequestHandler = async ({ request, cookies }) => {
  let body: { identifier?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const identifier =
    typeof body.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!identifier || !password) {
    return json(
      { error: "Email or phone and password are required" },
      { status: 400 },
    );
  }

  let email: string | null;
  try {
    email = await findActiveStaffLogin(identifier);
  } catch (err) {
    console.error(
      "staff login lookup failed:",
      err instanceof Error ? err.message : err,
    );
    return json({ error: AUTH_SERVICE_UNREACHABLE }, { status: 503 });
  }

  if (!email) {
    return json({ error: INVALID_LOGIN }, { status: 401 });
  }

  const { data, error } = await loginWithPassword(email, password);

  if (error?.message === AUTH_SERVICE_UNREACHABLE) {
    return json({ error: AUTH_SERVICE_UNREACHABLE }, { status: 503 });
  }

  if (error || !data.session || !data.user) {
    return json({ error: INVALID_LOGIN }, { status: 401 });
  }

  setUserSessionCookie(cookies, data.user);

  return json(
    {
      access_token: data.session.access_token,
      userId: data.user.id,
    },
    { status: 200 },
  );
};
