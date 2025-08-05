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

  // Load both events and guests data
  try {
    const [guestsData, eventsData] = await Promise.all([
      loadGuestsRows(user_Id),
      loadUserEventsForSelector(user_Id),
    ]);

    // If the regular function fails, try the bypass function
    if (guestsData.error) {
      const bypassData = await loadGuestsRowsBypass(user_Id);
      if (!bypassData.error) {
        return {
          guestsData: bypassData,
          eventsData,
        };
      }
    }

    return {
      guestsData,
      eventsData,
    };
  } catch (error) {
    return {
      guestsData: { data: [], error: error.message },
      eventsData: { data: [], error: error.message },
    };
  }
}
