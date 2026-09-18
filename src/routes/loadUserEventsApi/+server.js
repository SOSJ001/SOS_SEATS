import { json } from "@sveltejs/kit";
import { loadUserEvents } from "$lib/server/events";

export async function GET({ locals }) {
  try {
    const user_Id = locals.userId;

    if (!user_Id) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const events = await loadUserEvents(user_Id);
    return json({
      success: true,
      events: events,
    });
  } catch {
    return json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
