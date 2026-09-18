/**
 * POST /api/auth/phone/signup — phone+password create account (roadmap 2.2).
 * Body: { phone, password, name }
 */
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  normalizeSlPhone,
  signUpWithPhone,
  setUserSessionCookie,
  AUTH_SERVICE_UNREACHABLE,
} from "$lib/server/auth";

export const POST: RequestHandler = async ({ request, cookies }) => {
  let body: { phone?: string; password?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const phoneRaw = typeof body.phone === "string" ? body.phone : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!phoneRaw || !password || !name) {
    return json(
      { error: "Full name, phone number, and password are required" },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return json(
      { error: "Password should be at least 6 characters" },
      { status: 400 },
    );
  }

  const normalized = normalizeSlPhone(phoneRaw);
  if (!normalized.ok) {
    return json({ error: normalized.error }, { status: 400 });
  }

  const { data, error } = await signUpWithPhone(
    normalized.e164,
    password,
    name,
  );

  if (error?.message === AUTH_SERVICE_UNREACHABLE) {
    return json({ error: AUTH_SERVICE_UNREACHABLE }, { status: 503 });
  }

  if (error) {
    return json({ error: error.message }, { status: 400 });
  }

  if (!data.session || !data.user) {
    return json(
      {
        error:
          "Account created but email confirmation is required before you can sign in.",
      },
      { status: 400 },
    );
  }

  setUserSessionCookie(cookies, data.user, data.session.expires_at);

  return json(
    {
      access_token: data.session.access_token,
      userId: data.user.id,
    },
    { status: 201 },
  );
};
