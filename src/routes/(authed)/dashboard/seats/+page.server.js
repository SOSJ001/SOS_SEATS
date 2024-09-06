// @ts-nocheck
import { orderHistory } from "$lib/supabase.js";
export async function load({ parent, cookies }) {
  //getting the usr id
  let COOKIE_DATA = cookies.get("userSession");
  COOKIE_DATA = JSON.parse(COOKIE_DATA);
  const user_Id = COOKIE_DATA?.id;

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
    let historyData
    if (!historyData_.error) {
        historyData = historyData_.data
    } else {
        console.log(historyData_.error)
    }
  return { events, historyData };
}
