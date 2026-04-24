import { createServerClient } from "@supabase/ssr";
import { env } from "$env/dynamic/public";

/**
 * Server-only Supabase client. Uses the anon key and cookie storage so
 * `auth.getUser()` / RLS see the same JWT as the browser after `loginApi` runs
 * `setSession` (or after cookie-based sign-in). Custom `web3Session` still has
 * no JWT until wallet accounts are linked to Supabase Auth.
 *
 * @param {import("@sveltejs/kit").Cookies} cookies
 */
export function createSupabaseServerClient(cookies) {
  const supabaseUrl = env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return createServerClient(
      "https://placeholder.supabase.co",
      "placeholder-key",
      {
        cookies: {
          get: (key) => cookies.get(key),
          set: (key, value, options) => {
            cookies.set(key, value, { ...options, path: options?.path ?? "/" });
          },
          remove: (key, options) => {
            cookies.delete(key, { ...options, path: options?.path ?? "/" });
          },
        },
      }
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (key) => cookies.get(key),
      set: (key, value, options) => {
        cookies.set(key, value, { ...options, path: options?.path ?? "/" });
      },
      remove: (key, options) => {
        cookies.delete(key, { ...options, path: options?.path ?? "/" });
      },
    },
  });
}
