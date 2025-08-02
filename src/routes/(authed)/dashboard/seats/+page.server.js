// @ts-nocheck
import { orderHistory } from "$lib/supabase.js";
export async function load({ parent, cookies }) {
  //getting the usr id
  let userSession = cookies.get("userSession");
  let web3Session = cookies.get("web3Session");
  let user_Id = null;

  // Check traditional session first
  if (userSession) {
    try {
      const sessionData = JSON.parse(userSession);
      user_Id = sessionData.id;
    } catch (error) {
      }
  }
  
  // Check Web3 session if no traditional session
  if (!user_Id && web3Session) {
    try {
      const sessionData = JSON.parse(web3Session);
      if (sessionData.type === 'web3' && sessionData.user) {
        user_Id = sessionData.user.id;
      }
    } catch (error) {
      }
  }

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
        }
  return { events, historyData };
}
