import { json } from "@sveltejs/kit";
import { createSupabaseServerClient } from "$lib/supabase/server";

/**
 * Persists email/password session in Supabase auth cookies (JWT for RLS) and
 * keeps `userSession` for legacy helpers. Body: `{ sessionData }` from
 * `signInWithPassword` / `signUp` — must include access/refresh tokens and `user`.
 */
export async function POST({ request, cookies }) {
  let sessionData;
  try {
    const body = await request.json();
    sessionData = body.sessionData;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!sessionData || typeof sessionData !== "object") {
    return json({ error: "Missing sessionData" }, { status: 400 });
  }

  // Client sends `data.session` from `signInWithPassword` / `signUp` (Session shape:
  // top-level `access_token`, `refresh_token`, `user`).
  const user = sessionData.user;
  const access_token =
    sessionData.access_token ?? sessionData.session?.access_token;
  const refresh_token =
    sessionData.refresh_token ?? sessionData.session?.refresh_token;

  if (!user?.id) {
    return json({ error: "Missing user" }, { status: 400 });
  }

  if (!access_token || !refresh_token) {
    return json(
      {
        error:
          "Missing session tokens. Confirm the account email if you just signed up.",
      },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient(cookies);
  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) {
    return json({ error: error.message }, { status: 401 });
  }

  const userJson = JSON.stringify(user);
  cookies.set("userSession", userJson, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return json({}, { status: 201 });
}
