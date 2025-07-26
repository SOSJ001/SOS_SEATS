import { json } from "@sveltejs/kit";
import { supabase } from "$lib/supabase.js";
import { parseSession } from "$lib/sessionUtils.js";

export async function GET({ cookies }) {
  try {
    const sessionData = parseSession(cookies);
    const user_Id = sessionData.user_Id;
    const sessionType = sessionData.sessionType;

    console.log("debug-events-status - Session data:", sessionData);

    if (!user_Id) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get all events for this user with their status
    const { data: events, error } = await supabase
      .from("events")
      .select("id, name, status, created_at, user_id")
      .eq("user_id", user_Id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error);
      return json({ success: false, error: error.message }, { status: 500 });
    }

    console.log("debug-events-status - Events found:", events);

    // Group events by status
    const eventsByStatus = events.reduce((acc, event) => {
      const status = event.status || "null";
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(event);
      return acc;
    }, {});

    return json({
      success: true,
      user_id: user_Id,
      session_type: sessionType,
      total_events: events.length,
      events_by_status: eventsByStatus,
      all_events: events,
    });
  } catch (error) {
    console.error("Error in debug-events-status:", error);
    return json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
