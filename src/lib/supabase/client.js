// @ts-nocheck
/**
 * Browser: `@supabase/ssr` client — persists session in cookies so `hooks.server.js`
 * and `locals.supabase` see the same JWT for RLS (`auth.uid()`).
 * Server import: plain anon client without session (server code must use `locals.supabase`).
 */
import { browser } from "$app/environment";
import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env } from "$env/dynamic/public";

const supabaseUrl = env.PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) {
  console.error("Supabase environment variables are missing:", {
    url: !!env.PUBLIC_SUPABASE_URL,
    key: !!env.PUBLIC_SUPABASE_ANON_KEY,
  });
}

export const supabase = browser
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

export const ANONYMOUS_KEY = supabaseAnonKey;
