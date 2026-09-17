/**
 * POST /api/auth/signup — email/password create account (roadmap 2.1).
 * Body: { email, password, name, userName }
 */
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { signUpWithPassword, setUserSessionCookie } from "$lib/server/auth";

export const POST: RequestHandler = async ({ request, cookies }) => {
  let body: {
    email?: string;
    password?: string;
    name?: string;
    userName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const userName = typeof body.userName === "string" ? body.userName.trim() : "";

  if (!email || !password || !name || !userName) {
    return json(
      { error: "Full name, username, email, and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return json(
      { error: "Password should be at least 6 characters" },
      { status: 400 }
    );
  }

  const { data, error } = await signUpWithPassword(
    email,
    password,
    name,
    userName
  );

  if (error) {
    return json({ error: error.message }, { status: 400 });
  }

  if (!data.session || !data.user) {
    return json(
      {
        error:
          "Account created but email confirmation is required before you can sign in.",
      },
      { status: 400 }
    );
  }

  setUserSessionCookie(cookies, data.user, data.session.expires_at);

  return json(
    {
      access_token: data.session.access_token,
      userId: data.user.id,
    },
    { status: 201 }
  );
};
