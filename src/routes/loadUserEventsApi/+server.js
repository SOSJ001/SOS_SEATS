import { json } from "@sveltejs/kit";
import { loadUserEvents } from "$lib/supabase.js";
import { parseSession } from "$lib/sessionUtils.js";

export async function GET({ cookies }) {
  try {
    const sessionData = parseSession(cookies);
    const user_Id = sessionData.user_Id;
    const sessionType = sessionData.sessionType;

    if (!user_Id) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const events = await loadUserEvents(user_Id, sessionType || 'traditional');

    return json({
      success: true,
      events: events,
    });
  } catch (error) {
    console.error("Error loading user events:", error);
    return json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
