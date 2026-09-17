/**
 * Server-only Supabase client (roadmap 1.2).
 * Do not import from client components or +page.svelte.
 * Privileged Kit paths use this; browser keeps $lib/supabase anon client.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env as publicEnv } from "$env/dynamic/public";
import { env as privateEnv } from "$env/dynamic/private";

let cached: SupabaseClient | null = null;

/**
 * Lazy privileged Supabase client (service role).
 * Throws if PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.
 */
export function getServerSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = publicEnv.PUBLIC_SUPABASE_URL;
  const key = privateEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing env PUBLIC_SUPABASE_URL");
  }
  if (!key) {
    throw new Error("Missing env SUPABASE_SERVICE_ROLE_KEY");
  }

  cached = createClient(url, key);
  return cached;
}
