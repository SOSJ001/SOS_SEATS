// @ts-nocheck
import { orderHistory } from "$lib/supabase.js";

export async function load({ parent, locals }) {
  const user_Id = locals.userId;

  const [{ EventTableResult }, historyData_] = await Promise.all([
    parent(),
    orderHistory(user_Id),
  ]);
  let events = [];
  EventTableResult.map((arr) => {
    let object = {
      eventName: arr.Event.name,
      event_Id: arr.Event.id,
    };
    events = [...events, object];
  });
  //returning the order history below
  let historyData;
  if (!historyData_.error) {
    historyData = historyData_.data;
  } else {
  }
  return { events, historyData };
}
