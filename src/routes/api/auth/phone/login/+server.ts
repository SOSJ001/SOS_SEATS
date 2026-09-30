/**
 * POST /api/auth/phone/login — username|phone + password session (roadmap 2.7).
 * Body: { identifier, password }
 */
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  loginWithPassword,
  setUserSessionCookie,
  AUTH_SERVICE_UNREACHABLE,
  resolvePhoneLoginEmail,
  ensureAuthUsernameProvisioned,
  withRegistryUserName,
} from "$lib/server/auth";

export const POST: RequestHandler = async ({ request, cookies }) => {
  let body: { identifier?: string; password?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const identifierRaw =
    typeof body.identifier === "string"
      ? body.identifier.trim()
      : typeof body.phone === "string"
        ? body.phone.trim()
        : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!identifierRaw || !password) {
    return json(
      { error: "Username or phone and password are required" },
      { status: 400 },
    );
  }

  let resolved;
  try {
    resolved = await resolvePhoneLoginEmail(identifierRaw);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : AUTH_SERVICE_UNREACHABLE;
    return json({ error: message }, { status: 503 });
  }

  if (!resolved.ok) {
    return json(
      { error: "Invalid username or phone or password" },
      { status: 401 },
    );
  }

  const { data, error } = await loginWithPassword(resolved.email, password);

  if (error?.message === AUTH_SERVICE_UNREACHABLE) {
    return json({ error: AUTH_SERVICE_UNREACHABLE }, { status: 503 });
  }

  if (error || !data.session || !data.user) {
    return json(
      { error: "Invalid username or phone or password" },
      { status: 401 },
    );
  }

  const meta = data.user.user_metadata || {};
  await ensureAuthUsernameProvisioned({
    authUserId: data.user.id,
    userName: meta.userName || null,
  });

  setUserSessionCookie(
    cookies,
    await withRegistryUserName(data.user),
    data.session.expires_at,
  );

  return json(
    {
      access_token: data.session.access_token,
      userId: data.user.id,
    },
    { status: 200 },
  );
};
