import { createSupabaseServerClient } from "$lib/supabase/server";

/** @type {import("@sveltejs/kit").Handle} */
export const handle = async ({ event, resolve }) => {
  event.locals.supabase = createSupabaseServerClient(event.cookies);
  // Refresh session from cookies; keeps access token valid for RLS on this request.
  await event.locals.supabase.auth.getSession();

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === "content-range" || name === "x-supabase-api-version";
    },
  });
};
