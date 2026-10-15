// @ts-nocheck
/**
 * FREEZE (roadmap 1.2): do not add new Kit-privileged / server-only helpers here.
 * New privileged work goes under $lib/server/<domain>.
 * Existing exports remain for as-built client + transitional /api re-exports.
 *
 * FREEZE (roadmap 3.1): no reads/writes to singular legacy tables
 * (event, guest, image, seat, wallet, orderhistory, userandpublickey).
 * App I/O uses plural tables only; DROP is 3.3 (blocked).
 */
import { createClient } from "@supabase/supabase-js";
import { sessionFromDb } from "$lib/store";
import { DEFAULT_CATEGORY } from "$lib/eventCategories";
import { env } from "$env/dynamic/public";

// Get environment variables
const supabaseUrl = env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing:", {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
  });
  // Create a dummy client to prevent crashes, but it will fail on actual requests
  // This allows the app to load but will show errors when trying to use Supabase
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

// Signout function below
export async function signOutbtnFunction() {
  const { error } = await supabase.auth.signOut();
  sessionFromDb.set(null);
  return error;
}

// ===== WEB3 AUTHENTICATION FUNCTIONS =====

// Check if wallet exists in database
export async function checkWalletExists(walletAddress) {
  try {
    const { data, error } = await supabase.rpc("check_wallet_exists", {
      wallet_address_param: walletAddress,
    });

    if (error) {
      return { exists: false, user: null, error: error.message };
    }

    if (data && data.length > 0 && data[0].exists) {
      return {
        exists: true,
        user: {
          id: data[0].user_id,
          username: data[0].username,
          display_name: data[0].display_name,
        },
        error: null,
      };
    }

    return { exists: false, user: null, error: null };
  } catch (error) {
    return { exists: false, user: null, error: error.message };
  }
}

// Create new Web3 user
export async function createWeb3User(
  walletAddress,
  username = undefined,
  displayName = undefined
) {
  try {
    const { data, error } = await supabase.rpc("create_web3_user", {
      wallet_address_param: walletAddress,
      username_param: username,
      display_name_param: displayName,
    });

    if (error) {
      return { success: false, user: null, error: error.message };
    }

    if (data && data.length > 0 && data[0].success) {
      return {
        success: true,
        user: {
          id: data[0].user_id,
          username: data[0].username,
        },
        error: null,
      };
    }

    return {
      success: false,
      user: null,
      error: data?.[0]?.message || "Failed to create user",
    };
  } catch (error) {
    return { success: false, user: null, error: error.message };
  }
}

// Record Web3 sign in
export async function recordWeb3SignIn(walletAddress) {
  try {
    const { data, error } = await supabase.rpc("record_web3_sign_in", {
      wallet_address_param: walletAddress,
    });

    if (error) {
      return { success: false, user: null, error: error.message };
    }

    if (data && data.length > 0 && data[0].success) {
      return {
        success: true,
        user: {
          id: data[0].user_id,
          username: data[0].username,
        },
        error: null,
      };
    }

    return { success: false, user: null, error: "Failed to record sign in" };
  } catch (error) {
    return { success: false, user: null, error: error.message };
  }
}

// ===== WEB3 SESSION MANAGEMENT FUNCTIONS =====

// Wallet sign-in is switched off (see $lib/features.js): the old web3Session
// cookie was unsigned, so the server no longer accepts or issues it.
/**
 * @param {string} _walletAddress
 * @param {any} _userData
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function createWeb3Session(_walletAddress, _userData) {
  return { success: false, error: "Wallet sign-in is turned off" };
}

// Clear Web3 session
export async function clearWeb3Session() {
  try {
    const response = await fetch("/web3LogoutApi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      // Clear the session store
      sessionFromDb.set(null);
      return { success: true, error: null };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Wallet sessions are switched off; callers fall back to the signed userSession.
/** @returns {Promise<{ success: boolean, user: any, error?: string }>} */
export async function verifyWeb3Session() {
  return { success: false, user: null, error: "Wallet sign-in is turned off" };
}

// =====================================================
// NEW EVENT MANAGEMENT FUNCTIONS FOR UPDATED SCHEMA
// =====================================================

// Load all public events for marketplace
export async function loadPublicEvents() {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select(
        "id, name, date, time, location, image_id, is_free_event, category, tags, description, organizer, total_capacity"
      )
      .eq("event_visibility", "public")
      .eq("status", "published")
      .gte("date", new Date().toISOString().split("T")[0]) // Show events from today onwards
      .order("date", { ascending: true });

    if (error) {
      return [];
    }

    // Load related data for each event
    const transformedEvents = await Promise.all(
      events.map(async (event) => {
        // Load ticket types for this event
        const { data: ticketTypes } = await supabase
          .from("ticket_types")
          .select("*")
          .eq("event_id", event.id);

        // Load image for this event
        let imageUrl = null;
        if (event.image_id) {
          const { data: imageData } = await supabase
            .from("images")
            .select("file_path")
            .eq("id", event.image_id)
            .single();

          if (imageData?.file_path) {
            imageUrl = imageData.file_path;
          }
        }

        // Determine price from ticket types
        let price = "Free";
        if (!event.is_free_event && ticketTypes && ticketTypes.length > 0) {
          const lowestPrice = Math.min(
            ...ticketTypes.map((t) => parseFloat(t.price) || 0)
          );
          price = `NLe ${lowestPrice}`;
        }

        return {
          id: event.id,
          name: event.name,
          date: new Date(event.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          venue: event.location,
          image: imageUrl,
          price: price,
          category: event.category || DEFAULT_CATEGORY,
          tags: Array.isArray(event.tags) ? event.tags : [],
          description: event.description,
          time: event.time,
          organizer: event.organizer,
          total_capacity: event.total_capacity,
          ticket_types: ticketTypes || [],
          venue_sections: [], // We'll load these separately if needed
        };
      })
    );

    return transformedEvents;
  } catch (error) {
    return [];
  }
}

// Get event by ID with all related data
export async function getEventById(eventId) {
  try {
    // First get the basic event data
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError) {
      return null;
    }

    if (!eventData) {
      return null;
    }

    // Get related data separately to avoid RLS issues
    const { data: ticketTypes, error: ticketError } = await supabase
      .from("ticket_types")
      .select("*")
      .eq("event_id", eventId);

    // Load image data if event has an image_id
    let images = [];
    if (eventData.image_id) {
      const { data: imageData, error: imageError } = await supabase
        .from("images")
        .select("*")
        .eq("id", eventData.image_id);

      if (!imageError && imageData) {
        images = imageData;
      }
    }

    const { data: venueSections, error: venueError } = await supabase
      .from("venue_sections")
      .select("*")
      .eq("event_id", eventId);

    const { data: seatingOptions, error: seatingError } = await supabase
      .from("seating_options")
      .select("*")
      .eq("event_id", eventId);

    // Combine all data
    const fullEventData = {
      ...eventData,
      ticket_types: ticketTypes || [],
      images: images,
      venue_sections: venueSections || [],
      seating_options: seatingOptions || [],
    };

    return fullEventData;
  } catch (error) {
    return null;
  }
}

// Claim free/paid tickets (Kit service-role path after 3.2 RLS harden)
export async function claimFreeTickets(
  eventId,
  selectedTickets,
  userData,
  paymentInfo = null
) {
  try {
    const response = await fetch("/api/tickets/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        selectedTickets,
        userData,
        paymentInfo,
      }),
    });
    const json = await response.json().catch(() => ({ success: false }));
    return { ...json, status: response.status };
  } catch (error) {
    console.error("Error claiming tickets:", error);
    return {
      success: false,
      error: error.message || "Failed to claim tickets",
    };
  }
}
