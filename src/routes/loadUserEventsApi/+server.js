import { json } from "@sveltejs/kit";
import { loadUserEvents } from "$lib/supabase.js";

export async function GET({ locals }) {
  try {
    const user_Id = locals.userId;
    const sessionType = locals.sessionType;

    if (!user_Id) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const events = await loadUserEvents(user_Id, sessionType || "traditional");
    return json({
      success: true,
      events: events,
    });
  } catch (error) {
    return json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
