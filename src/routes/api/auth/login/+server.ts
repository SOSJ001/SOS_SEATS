/**
 * POST /api/auth/login — email/password session (roadmap 2.1).
 * Body: { email, password }
 */
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { loginWithPassword, setUserSessionCookie } from "$lib/server/auth";

export const POST: RequestHandler = async ({ request, cookies }) => {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return json({ error: "Email and password are required" }, { status: 400 });
  }

  const { data, error } = await loginWithPassword(email, password);

  if (error || !data.session || !data.user) {
    return json(
      { error: error?.message || "Invalid email or password" },
      { status: 401 }
    );
  }

  setUserSessionCookie(cookies, data.user, data.session.expires_at);

  return json(
    {
      access_token: data.session.access_token,
      userId: data.user.id,
    },
    { status: 200 }
  );
};
