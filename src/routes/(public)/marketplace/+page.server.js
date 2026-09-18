import { loadPublicEvents } from "$lib/supabase";

export async function load() {
  const marketplaceEvent = await loadPublicEvents();
  return { marketplaceEvent: marketplaceEvent || [] };
}
