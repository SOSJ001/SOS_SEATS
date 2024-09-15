import { loadEventToMarketplaceTable } from "$lib/supabase";

export async function load() {
    // load public events to the marketplace 
    const marketplaceEvent = await loadEventToMarketplaceTable("Public");
    return { marketplaceEvent } 
}