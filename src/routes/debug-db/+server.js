import { json } from "@sveltejs/kit";
import { supabase } from "$lib/supabase.js";

export async function GET() {
  try {
    // Get all events from database
    const { data: allEvents, error: allEventsError } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (allEventsError) {
      console.error("Error fetching all events:", allEventsError);
      return json({ error: allEventsError.message }, { status: 500 });
    }

    // Get all web3_users
    const { data: web3Users, error: web3UsersError } = await supabase
      .from("web3_users")
      .select("*");

    if (web3UsersError) {
      console.error("Error fetching web3_users:", web3UsersError);
    }

    return json({
      totalEvents: allEvents?.length || 0,
      events: allEvents || [],
      web3Users: web3Users || [],
      web3UsersCount: web3Users?.length || 0
    });
  } catch (error) {
    console.error("Error in debug-db:", error);
    return json({ error: error.message }, { status: 500 });
  }
} 