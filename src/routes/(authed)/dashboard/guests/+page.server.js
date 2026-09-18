//@ts-nocheck
import {
  loadGuestsRows,
  loadUserEventsForSelector,
} from "$lib/supabase";

export async function load({ locals }) {
  const user_Id = locals.userId;

  // If no authenticated user, return empty datasets
  if (!user_Id) {
    return {
      guestsData: { data: [], error: null },
      eventsData: { data: [], error: null },
    };
  }

  // Load both events and guests data
  try {
    const [guestsData, eventsData] = await Promise.all([
      loadGuestsRows(user_Id),
      loadUserEventsForSelector(user_Id),
    ]);

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
