/**
 * POST /api/auth/phone/login — phone+password session (roadmap 2.2).
 * Body: { phone, password }
 */
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  normalizeSlPhone,
  loginWithPhone,
  setUserSessionCookie,
  AUTH_SERVICE_UNREACHABLE,
} from "$lib/server/auth";

export const POST: RequestHandler = async ({ request, cookies }) => {
  let body: { phone?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const phoneRaw = typeof body.phone === "string" ? body.phone : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!phoneRaw || !password) {
    return json(
      { error: "Phone number and password are required" },
      { status: 400 },
    );
  }

  const normalized = normalizeSlPhone(phoneRaw);
  if (!normalized.ok) {
    return json({ error: normalized.error }, { status: 400 });
  }

  const { data, error } = await loginWithPhone(normalized.e164, password);

  if (error?.message === AUTH_SERVICE_UNREACHABLE) {
    return json({ error: AUTH_SERVICE_UNREACHABLE }, { status: 503 });
  }

  if (error || !data.session || !data.user) {
    return json(
      { error: error?.message || "Invalid phone or password" },
      { status: 401 },
    );
  }

  setUserSessionCookie(cookies, data.user, data.session.expires_at);

  return json(
    {
      access_token: data.session.access_token,
      userId: data.user.id,
    },
    { status: 200 },
  );
};
