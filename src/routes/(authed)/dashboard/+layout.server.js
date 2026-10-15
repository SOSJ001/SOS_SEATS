//@ts-nocheck
import { loadUserEvents, getRecentActivities } from "$lib/server/events";

function emptyDashboard() {
  return {
    EventTableResult: [],
    events: [],
    dashboardStats: {
      liveEvents: 0,
      totalTicketsSold: 0,
      totalRevenue: 0,
      guestsCheckedIn: 0,
    },
  };
}

export async function load({ locals, depends }) {
  // Uses no url/params, so the dashboard page invalidates this on in-app visits.
  depends("app:dashboard");
  const user_Id = locals.userId;
  const userName = locals.userName;
  const sessionType = locals.sessionType;
  const linkedWalletAddress = locals.linkedWalletAddress;

  if (!user_Id) {
    return {
      ...emptyDashboard(),
      user_Id: null,
      userName: null,
      sessionType: null,
      linkedWalletAddress: null,
    };
  }

  // Staff never see organiser events or activity (roadmap 7.3).
  if (sessionType === "staff") {
    return {
      ...emptyDashboard(),
      recentActivities: [],
      user_Id,
      userName,
      sessionType,
      linkedWalletAddress: null,
    };
  }

  const events = await loadUserEvents(user_Id);

  const EventTableResult = events.map((event) => ({
    Event: {
      id: event.id,
      name: event.name,
      date: event.date,
      venue: event.location,
      audience: event.audience_type,
      imageId: event.image_id,
      status: event.status,
    },
    Image: event.image || null,
  }));

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

  let recentActivities = [];
  try {
    recentActivities = (await getRecentActivities(user_Id)) || [];
  } catch (error) {
    console.error("Error loading recent activities:", error);
    recentActivities = [];
  }

  return {
    EventTableResult,
    events,
    dashboardStats,
    recentActivities,
    user_Id,
    userName,
    sessionType,
    linkedWalletAddress,
  };
}
