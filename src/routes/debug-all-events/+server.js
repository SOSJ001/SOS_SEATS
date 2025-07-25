import { json } from "@sveltejs/kit";
import { supabase } from "$lib/supabase.js";

export async function GET() {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading all events:", error);
      return json({ success: false, error: error.message }, { status: 500 });
    }

    return json({
      success: true,
      events: events || []
    });
  } catch (error) {
    console.error("Error in debug-all-events:", error);
    return json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 