import { json } from "@sveltejs/kit";
import { supabase } from "$lib/supabase.js";
import { parseSession } from "$lib/sessionUtils.js";

export async function GET({ cookies }) {
  try {
    const sessionData = parseSession(cookies);
    const user_Id = sessionData.user_Id;
    const sessionType = sessionData.sessionType;
    const walletAddress = sessionData.walletAddress;

    console.log("Debug event creation - Session data:", sessionData);

    // Get all events from database
    const { data: allEvents, error: allEventsError } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (allEventsError) {
      console.error("Error fetching all events:", allEventsError);
    }

    // Get web3_users table data
    const { data: web3Users, error: web3UsersError } = await supabase
      .from("web3_users")
      .select("*");

    if (web3UsersError) {
      console.error("Error fetching web3_users:", web3UsersError);
    }

    // Get events for the current user
    const { data: userEvents, error: userEventsError } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user_Id);

    if (userEventsError) {
      console.error("Error fetching user events:", userEventsError);
    }

    // Get web3 user record for current user
    let web3UserRecord = null;
    if (walletAddress) {
      const { data: web3User, error: web3UserError } = await supabase
        .from("web3_users")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single();

      if (!web3UserError && web3User) {
        web3UserRecord = web3User;
      }
    }

    return json({
      sessionData: {
        user_Id,
        sessionType,
        walletAddress,
      },
      allEvents: allEvents || [],
      web3Users: web3Users || [],
      userEvents: userEvents || [],
      web3UserRecord,
      analysis: {
        totalEvents: allEvents?.length || 0,
        userEventsCount: userEvents?.length || 0,
        web3UsersCount: web3Users?.length || 0,
        hasWeb3UserRecord: !!web3UserRecord,
        web3UserId: web3UserRecord?.id || null,
        sessionUserId: user_Id,
      },
    });
  } catch (error) {
    console.error("Error in debug-event-creation:", error);
    return json({ error: error.message }, { status: 500 });
  }
}
