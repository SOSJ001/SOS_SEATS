/**
 * Email/password grant helpers (roadmap 2.1).
 */
import { getAnonSupabase } from "./anon";

export async function loginWithPassword(email: string, password: string) {
  const supabase = getAnonSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUpWithPassword(
  email: string,
  password: string,
  name: string,
  userName: string
) {
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
}
