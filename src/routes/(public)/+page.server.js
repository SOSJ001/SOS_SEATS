import { loadPublicEvents } from "$lib/supabase";

/** Public landing upcoming events (roadmap 1.3 / 3.1 plural-first). */
export async function load() {
  const events = await loadPublicEvents();
  return { events: events || [] };
}
