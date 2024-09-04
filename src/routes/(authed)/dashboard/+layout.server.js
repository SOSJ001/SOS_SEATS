import { loadEventToTable } from "$lib/supabase";

export async function load() {
    const EventTableResult = await loadEventToTable();
    return { EventTableResult };
}