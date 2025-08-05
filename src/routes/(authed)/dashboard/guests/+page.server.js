//@ts-nocheck
import {
  loadGuestsRows,
  loadGuestsRowsBypass,
  loadUserEventsForSelector,
  getUserIdFromCookies,
} from "$lib/supabase";

export async function load({ cookies }) {
  // Use the helper function to get user ID
  const user_Id = getUserIdFromCookies(cookies);

  console.log("Server: Loading data for user ID:", user_Id);

  // Load both events and guests data
  try {
    // Force use of bypass function for now to debug
    const [guestsData, eventsData] = await Promise.all([
      loadGuestsRowsBypass(user_Id),
      loadUserEventsForSelector(user_Id),
    ]);

    console.log("Server: Guests data result:", {
      hasData: !!guestsData.data,
      dataLength: guestsData.data?.length || 0,
      error: guestsData.error,
    });

    console.log("Server: Events data result:", {
      hasData: !!eventsData.data,
      dataLength: eventsData.data?.length || 0,
      error: eventsData.error,
    });

    return {
      guestsData,
      eventsData,
    };
  } catch (error) {
    console.error("Server: Error loading data:", error);
    return {
      guestsData: { data: [], error: error.message },
      eventsData: { data: [], error: error.message },
    };
  }
}
