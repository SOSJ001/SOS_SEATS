//@ts-nocheck
import { env } from "$env/dynamic/private";
import { loadUserEvents, getRecentActivities } from "$lib/supabase";
import { parseSession } from "$lib/sessionUtils.js";

function parseOpsAdminIds() {
  const raw = env.OPS_ADMIN_USER_IDS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseOpsAdminWallets() {
  const raw = env.OPS_ADMIN_WALLETS || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function load({ cookies, locals }) {
  const {
    data: { user },
  } = await locals.supabase.auth.getUser();

  let user_Id = null;
  let userName = null;
  let sessionType = null;
  let walletAddress = null;

  if (user?.id) {
    user_Id = user.id;
    userName =
      user.user_metadata?.userName || user.user_metadata?.name || null;
    sessionType = "traditional";
  } else {
    const parsed = parseSession(cookies);
    user_Id = parsed.user_Id;
    userName = parsed.userName;
    sessionType = parsed.sessionType;
    walletAddress = parsed.walletAddress;
  }

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
      isOpsAdmin: false,
    };
  }

  const adminIds = parseOpsAdminIds();
  const adminWallets = parseOpsAdminWallets();
  const normalizedWallet = walletAddress?.trim().toLowerCase() || null;
  const isOpsAdminById = adminIds.length > 0 && adminIds.includes(user_Id);
  const isOpsAdminByWallet =
    Boolean(normalizedWallet) &&
    adminWallets.length > 0 &&
    adminWallets.includes(normalizedWallet);
  const isOpsAdmin = isOpsAdminById || isOpsAdminByWallet;

  // Use the new loadUserEvents function instead of the old loadEventToTable
  const events = await loadUserEvents(user_Id, sessionType, locals.supabase);

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
    recentActivities = (await getRecentActivities(user_Id, locals.supabase)) || [];
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
    isOpsAdmin,
  };
}
