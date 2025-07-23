//@ts-nocheck
import { loadEventToTable } from "$lib/supabase";
import { parseSession } from "$lib/sessionUtils.js";

export async function load({ cookies }) {
  const { user_Id, userName, sessionType } = parseSession(cookies);

  if (!user_Id) {
    console.log("No valid session found for dashboard");
    return {
      EventTableResult: [],
      user_Id: null,
      userName: null,
      sessionType: null,
    };
  }

  const EventTableResult = await loadEventToTable(user_Id);
  return { EventTableResult, user_Id, userName, sessionType };
}
