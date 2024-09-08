//@ts-nocheck
import { loadEventToTable } from "$lib/supabase";

export async function load({ cookies }) {
  let COOKIE_DATA = cookies.get("userSession");
  if (COOKIE_DATA) COOKIE_DATA = JSON.parse(COOKIE_DATA);
  const user_Id = COOKIE_DATA?.id;
  const EventTableResult = await loadEventToTable(user_Id);
  return { EventTableResult, user_Id };
}
