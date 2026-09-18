/**
 * Email/password grant helpers (roadmap 2.1).
 */
import { getAnonSupabase } from "./anon";

export const AUTH_SERVICE_UNREACHABLE =
  "Can't reach the auth service. Check your connection and try again.";

function catchAuthThrow(err: unknown) {
  const message =
    err instanceof Error && err.message.includes("Missing env")
      ? err.message
      : AUTH_SERVICE_UNREACHABLE;
  return {
    data: { user: null, session: null },
    error: { message },
  };
}

export async function loginWithPassword(email: string, password: string) {
  try {
    const supabase = getAnonSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (err) {
    return catchAuthThrow(err);
  }
}

export async function signUpWithPassword(
  email: string,
  password: string,
  name: string,
  userName: string,
) {
  try {
    const supabase = getAnonSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          userName,
        },
      },
    });
    return { data, error };
  } catch (err) {
    return catchAuthThrow(err);
  }
}
