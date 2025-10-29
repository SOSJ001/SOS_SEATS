//@ts-nocheck
import { loadUserEvents, getRecentActivities } from "$lib/supabase";
import { parseSession } from "$lib/sessionUtils.js";

export async function load({ cookies }) {
  const { user_Id, userName, sessionType } = parseSession(cookies);

  if (!user_Id) {
    return {
      EventTableResult: [],
      events: [],
      dashboardStats: {
        liveEvents: 0,
        totalTicketsSold: 0,
        totalRevenue: 0,
        guestsCheckedIn: 0,
      },
      user_Id: null,
      userName: null,
      sessionType: null,
    };
  }

  // Use the new loadUserEvents function instead of the old loadEventToTable
  const events = await loadUserEvents(user_Id, sessionType);

  // Transform the data to match the expected format for backward compatibility
  const EventTableResult = events.map((event) => ({
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
    Image: event.image || null,
  }));

  // Calculate aggregate dashboard statistics from all events
  const dashboardStats = {
    liveEvents: events.filter(
      (e) => e.status === "published" || e.status === "live"
    ).length,
    totalTicketsSold: events.reduce((sum, event) => {
      return sum + (event.realTimeStats?.totalTicketsSold || 0);
    }, 0),
    totalRevenue: events.reduce((sum, event) => {
      return sum + parseFloat(event.realTimeStats?.totalRevenue || 0);
    }, 0),
    guestsCheckedIn: events.reduce((sum, event) => {
      return sum + (event.realTimeStats?.attendeesCheckedIn || 0);
    }, 0),
  };

  // Get recent activities data
  let recentActivities = [];
  try {
    recentActivities = (await getRecentActivities(user_Id)) || [];
  } catch (error) {
    console.error("Error loading recent activities:", error);
    recentActivities = [];
  }

  return {
    EventTableResult,
    events, // Include full events data for stats
    dashboardStats,
    recentActivities,
    user_Id,
    userName,
    sessionType,
  };
}
