/**
 * POST /api/auth/phone/signup — phone+password create account (roadmap 2.7).
 * Body: { phone, password, userName }
 */
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  normalizeSlPhone,
  signUpWithPhone,
  setUserSessionCookie,
  AUTH_SERVICE_UNREACHABLE,
  normalizeUsername,
  isUsernameTaken,
  provisionAuthUsername,
} from "$lib/server/auth";

export const POST: RequestHandler = async ({ request, cookies }) => {
  let body: { phone?: string; password?: string; userName?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const phoneRaw = typeof body.phone === "string" ? body.phone : "";
  const password = typeof body.password === "string" ? body.password : "";
  const userNameRaw =
    typeof body.userName === "string" ? body.userName.trim() : "";

  if (!phoneRaw || !password || !userNameRaw) {
    return json(
      { error: "Username, phone number, and password are required" },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return json(
      { error: "Password should be at least 6 characters" },
      { status: 400 },
    );
  }

  const usernameNorm = normalizeUsername(userNameRaw);
  if (!usernameNorm.ok) {
    return json({ error: usernameNorm.error }, { status: 400 });
  }

  const normalized = normalizeSlPhone(phoneRaw);
  if (!normalized.ok) {
    return json({ error: normalized.error }, { status: 400 });
  }

  try {
    if (await isUsernameTaken(usernameNorm.username)) {
      return json({ error: "Username already taken" }, { status: 400 });
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : AUTH_SERVICE_UNREACHABLE;
    return json({ error: message }, { status: 503 });
  }

  const { data, error } = await signUpWithPhone(
    normalized.e164,
    password,
    usernameNorm.username,
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

  const provisioned = await provisionAuthUsername({
    authUserId: data.user.id,
    username: usernameNorm.username,
  });
  if (!provisioned.ok) {
    return json(
      { error: provisioned.error },
      { status: provisioned.conflict ? 400 : 500 },
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
