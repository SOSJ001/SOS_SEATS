import { loadEventToMarketplaceTable } from "$lib/supabase";

/** Public landing upcoming events (roadmap 1.3). Reuses marketplace helper. */
export async function load() {
  const events = await loadEventToMarketplaceTable("Public");
  return { events: events || [] };
}
