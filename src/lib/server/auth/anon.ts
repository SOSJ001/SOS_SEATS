/**
 * Anon Supabase client for password grant / getUser(jwt).
 * Do not use service-role here (roadmap 2.1).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env as publicEnv } from "$env/dynamic/public";

let cached: SupabaseClient | null = null;

export function getAnonSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = publicEnv.PUBLIC_SUPABASE_URL;
  const key = publicEnv.PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing env PUBLIC_SUPABASE_URL");
  }
  if (!key) {
    throw new Error("Missing env PUBLIC_SUPABASE_ANON_KEY");
  }

  cached = createClient(url, key);
  return cached;
}
