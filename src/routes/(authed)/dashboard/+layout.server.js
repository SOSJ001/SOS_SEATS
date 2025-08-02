//@ts-nocheck
import { loadUserEvents } from "$lib/supabase";
import { parseSession } from "$lib/sessionUtils.js";

export async function load({ cookies }) {
  const { user_Id, userName, sessionType } = parseSession(cookies);

  if (!user_Id) {
    return {
      EventTableResult: [],
      user_Id: null,
      userName: null,
      sessionType: null,
    };
  }

  // Use the new loadUserEvents function instead of the old loadEventToTable
  const events = await loadUserEvents(user_Id, sessionType);
  
  // Transform the data to match the expected format for backward compatibility
  const EventTableResult = events.map(event => ({
    Event: {
      id: event.id,
      name: event.name,
      date: event.date,
      venue: event.location,
      audience: event.audience_type,
      imageId: event.image_id,
      status: event.status,
      // Add other fields as needed
    },
    Image: event.image || null
  }));

  return { EventTableResult, user_Id, userName, sessionType };
}
