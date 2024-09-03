import { loadEventToTable, supabase } from "$lib/supabase";

export function load() {
    const EventTableResult = loadEventToTable();
    return { EventTableResult };
}