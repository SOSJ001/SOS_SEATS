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
import { generateUniqueFilename } from "$lib/store";
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

// Export the anonymous key for use in non-authenticated operations
export const ANONYMOUS_KEY = supabaseAnonKey;

// Cache bust comment - updated to force browser refresh

//sign up function
export async function createAccount(email, password, userName) {
  const response = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        userName: userName,
      },
    },
  });
  return response;
}

// login finction
export async function loginbtnFunction(email1, password1) {
  const response = await supabase.auth.signInWithPassword({
    email: email1,
    password: password1,
  });
  return response;
}
// Signout function below
export async function signOutbtnFunction() {
  const { error } = await supabase.auth.signOut();
  sessionFromDb.set(null);
  return error;
}

//load Specific Event's guest rows
export async function loadEventGuestsRows(event_id) {
  try {
    const { data: guests, error } = await supabase
      .from("guests")
      .select(
        `
        *,
        ticket_types(name, price),
        venue_sections(name, price),
        events(name)
      `
      )
      .eq("event_id", event_id)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error };
    }

    // Transform the data to match the expected format
    const transformedGuests = guests.map((guest) => ({
      id: guest.id,
      name: `${guest.first_name} ${guest.last_name}`,
      email: guest.email,
      status:
        guest.status === "checked-in"
          ? "Checked In"
          : guest.status === "pending"
          ? "Pending"
          : guest.status === "confirmed"
          ? "Confirmed"
          : guest.status === "cancelled"
          ? "Cancelled"
          : "Pending",
      avatar:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2MzY2ZjEiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgNC44MyAyLjE2IDQuODMgNC44M1MxNC42NyAxNC42NyAxMiAxNC42N1M3LjE3IDEyLjUxIDcuMTcgOS44M1M5LjMzIDUgMTIgNXptMCAxMmM0LjQyIDAgOC4xNy0yLjE2IDEwLjQyLTUuNDJDMjAuMTUgMTUuNjYgMTYuNDIgMTggMTIgMThzLTguMTUtMi4zNC0xMC40Mi01LjQyQzMuODMgMTQuODQgNy41OCAxNyAxMiAxN3oiLz4KPC9zdmc+Cjwvc3ZnPgo=",
      ticket_number: guest.ticket_number,
      phone: guest.phone,
      wallet_address: guest.wallet_address,
      seat_number: guest.seat_number,
      check_in_time: guest.check_in_time,
      event_id: guest.event_id,
      event_title: guest.events?.name || "Unknown Event",
      ticket_type: guest.ticket_types?.name || "General",
      ticket_price: guest.ticket_types?.price || 0,
      venue_section: guest.venue_sections?.name || null,
      special_requirements: guest.special_requirements,
    }));

    return { data: transformedGuests, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
}

// Load user events for event selector
export async function loadUserEventsForSelector(userId) {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("id, name, date, image_id, ticket_design_config")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      return { data: [], error };
    }

    // Load images for events that have image_id
    const eventsWithImages = await Promise.all(
      events.map(async (event) => {
        let eventWithImage = event;

        if (event.image_id) {
          try {
            const { data: imageData, error: imageError } = await supabase
              .from("images")
              .select("file_path")
              .eq("id", event.image_id)
              .single();

            if (!imageError && imageData) {
              // Check if file_path is already a full URL or just a file name
              if (imageData.file_path.startsWith("http")) {
                // Already a full URL
                eventWithImage.image = imageData.file_path;
              } else {
                // Construct the full public URL for the image
                const { data: urlData } = supabase.storage
                  .from("event_images")
                  .getPublicUrl(imageData.file_path);

                eventWithImage.image = urlData.publicUrl;
              }
            }
          } catch (imageErr) {
            // If image loading fails, continue without image
            console.warn("Failed to load image for event:", event.id, imageErr);
          }
        }

        return eventWithImage;
      })
    );

    // Transform to match expected format
    const transformedEvents = eventsWithImages.map((event) => ({
      id: event.id,
      title: event.name, // Map name to title for compatibility
      date: event.date,
      image: event.image, // Include the image path
      ticket_design_config: event.ticket_design_config, // Include the design config
    }));

    return { data: transformedEvents, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
}
// Seats out of v1 (roadmap 3.1): no singular orderhistory reads.
export async function orderHistory(_user_id) {
  return { data: [], error: null };
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

// Get Web3 user profile
export async function getWeb3UserProfile(walletAddress) {
  try {
    const { data, error } = await supabase
      .from("web3_user_profiles")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single();

    if (error) {
      return { success: false, user: null, error: error.message };
    }

    return { success: true, user: data, error: null };
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

// Create a new event with all details using the new schema
export async function updateEventWithDetails(
  eventId,
  eventData,
  userId,
  fullEventData
) {
  try {
    // First, update the main event record
    const { data: eventUpdateData, error: eventUpdateError } = await supabase
      .from("events")
      .update({
        name: eventData.name,
        description: eventData.description,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        venue_address: eventData.venue_address,
        category: eventData.category,
        tags: eventData.tags,
        organizer: eventData.organizer,
        contact_email: eventData.contact_email,
        website: eventData.website,
        social_media: eventData.social_media,
        image_id: eventData.image_id,
        is_free_event: eventData.is_free_event,
        seating_type: eventData.seating_type,
        total_capacity: eventData.total_capacity,
        audience_type: eventData.audience_type,
        event_visibility: eventData.event_visibility,
        status: eventData.status, // Include status field
        published_at: eventData.published_at, // Include published_at field
        ticket_design_config: eventData.ticket_design_config, // Include ticket design config
        updated_at: eventData.updated_at,
      })
      .eq("id", eventId)
      .eq("user_id", userId)
      .select()
      .single();

    if (eventUpdateError) {
      return { success: false, error: eventUpdateError.message };
    }

    // Update ticket types if they exist
    if (fullEventData.ticket_types && fullEventData.ticket_types.length > 0) {
      // Delete existing ticket types
      const { error: deleteTicketError } = await supabase
        .from("ticket_types")
        .delete()
        .eq("event_id", eventId);

      if (deleteTicketError) {
      }

      // Insert new ticket types
      const ticketTypesToInsert = fullEventData.ticket_types.map((ticket) => ({
        event_id: eventId,
        name: ticket.name,
        price: ticket.price,
        quantity: ticket.quantity,
        description: ticket.description,
        benefits: ticket.benefits,
      }));

      const { error: ticketInsertError } = await supabase
        .from("ticket_types")
        .insert(ticketTypesToInsert);

      if (ticketInsertError) {
        return { success: false, error: ticketInsertError.message };
      }
    }

    // Update venue sections if they exist
    if (
      fullEventData.venue_sections &&
      fullEventData.venue_sections.length > 0
    ) {
      // Delete existing venue sections
      const { error: deleteVenueError } = await supabase
        .from("venue_sections")
        .delete()
        .eq("event_id", eventId);

      if (deleteVenueError) {
      }

      // Insert new venue sections
      const venueSectionsToInsert = fullEventData.venue_sections.map(
        (section) => ({
          event_id: eventId,
          name: section.name,
          capacity: section.capacity,
          price: section.price,
          description: section.description,
          seating_chart_data: section.seating_chart_data,
        })
      );

      const { error: venueInsertError } = await supabase
        .from("venue_sections")
        .insert(venueSectionsToInsert);

      if (venueInsertError) {
        return { success: false, error: venueInsertError.message };
      }
    }

    // Update seating options if they exist
    if (fullEventData.seating_options) {
      // Delete existing seating options
      const { error: deleteSeatingError } = await supabase
        .from("seating_options")
        .delete()
        .eq("event_id", eventId);

      if (deleteSeatingError) {
      }

      // Insert new seating options
      const { error: seatingInsertError } = await supabase
        .from("seating_options")
        .insert({
          event_id: eventId,
          allow_seat_selection:
            fullEventData.seating_options.allow_seat_selection,
          max_seats_per_order:
            fullEventData.seating_options.max_seats_per_order,
          reserved_seating: fullEventData.seating_options.reserved_seating,
          has_seating_chart: fullEventData.seating_options.has_seating_chart,
        });

      if (seatingInsertError) {
        return { success: false, error: seatingInsertError.message };
      }
    }

    return { success: true, event_id: eventId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Load all public events for marketplace
export async function loadPublicEvents() {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select(
        "id, name, date, time, location, image_id, is_free_event, category, description, organizer, total_capacity"
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
          category: event.category || "General",
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

// Load events for the signed-in user through the Kit API (browser only; server code uses $lib/server/events)
export async function loadUserEvents(_userId, _sessionType = "traditional") {
  if (typeof window === "undefined") return [];
  try {
    const response = await fetch("/loadUserEventsApi");
    const result = await response.json();
    if (!result.success) return [];
    return result.events || [];
  } catch (error) {
    return [];
  }
}

// Get recent activities for dashboard
export async function getRecentActivities(userId) {
  try {
    const activities = [];

    // 1. Get recent orders (ticket sales)
    const { data: recentOrders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        total_amount,
        payment_method,
        created_at,
        events!inner(
          id,
          name,
          user_id
        )
      `
      )
      .eq("events.user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!ordersError && recentOrders) {
      recentOrders.forEach((order) => {
        activities.push({
          type: "ticket_sale",
          icon: "ticket",
          message: `Ticket Sold: ${order.events.name}`,
          details: `Order #${order.order_number} - $${parseFloat(
            order.total_amount
          ).toFixed(2)} via ${order.payment_method}`,
          time: formatTimeAgo(order.created_at),
          timestamp: order.created_at,
        });
      });
    }

    // 2. Get recent guest check-ins
    const { data: recentCheckIns, error: checkInsError } = await supabase
      .from("guests")
      .select(
        `
        id,
        first_name,
        last_name,
        check_in_time,
        events!inner(
          id,
          name,
          user_id
        )
      `
      )
      .eq("events.user_id", userId)
      .not("check_in_time", "is", null)
      .order("check_in_time", { ascending: false })
      .limit(3);

    if (!checkInsError && recentCheckIns) {
      recentCheckIns.forEach((guest) => {
        activities.push({
          type: "check_in",
          icon: "users",
          message: `Guest Checked In: ${guest.first_name} ${guest.last_name}`,
          details: `Event: ${guest.events.name}`,
          time: formatTimeAgo(guest.check_in_time),
          timestamp: guest.check_in_time,
        });
      });
    }

    // 3. Get recent events created
    const { data: recentEvents, error: eventsError } = await supabase
      .from("events")
      .select("id, name, created_at, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(2);

    if (!eventsError && recentEvents) {
      recentEvents.forEach((event) => {
        activities.push({
          type: "event_created",
          icon: "calendar",
          message: `Event Created: ${event.name}`,
          details: `Status: ${event.status}`,
          time: formatTimeAgo(event.created_at),
          timestamp: event.created_at,
        });
      });
    }

    // Sort all activities by timestamp (most recent first) and take the 6 most recent
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
}

// Helper function to format time ago
function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Update event status
export async function updateEventStatus(eventId, status) {
  try {
    const { data, error } = await supabase
      .from("events")
      .update({
        status: status,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .eq("id", eventId)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Add guest to event (Kit service-role path after 3.2 RLS harden)
export async function addGuestToEvent(eventId, guestData) {
  try {
    const response = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, guestData }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Load guests for an event
export async function loadEventGuests(eventId) {
  try {
    const { data: guests, error } = await supabase
      .from("guests")
      .select(
        `
        *,
        ticket_types(name, price),
        venue_sections(name, price)
      `
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return guests;
  } catch (error) {
    return [];
  }
}

// Create order
export async function createOrder(orderData) {
  try {
    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          event_id: orderData.event_id,
          buyer_id: orderData.buyer_id,
          buyer_wallet_address: orderData.buyer_wallet_address,
          buyer_email: orderData.buyer_email,
          buyer_name: orderData.buyer_name,
          order_number: orderData.order_number,
          total_amount: orderData.total_amount,
          currency: orderData.currency || "NLe",
          payment_method: orderData.payment_method,
          payment_status: orderData.payment_status || "pending",
          transaction_hash: orderData.transaction_hash,
          order_status: orderData.order_status || "pending",
        },
      ])
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Add order items
export async function addOrderItems(orderId, items) {
  try {
    const orderItems = items.map((item) => ({
      order_id: orderId,
      ticket_type_id: item.ticket_type_id,
      venue_section_id: item.venue_section_id,
      guest_id: item.guest_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      ticket_number: item.ticket_number,
    }));

    const { data, error } = await supabase
      .from("order_items")
      .insert(orderItems)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Load ticket types for a specific event (Kit path for organizer dashboard)
export async function loadEventTicketTypes(eventId) {
  try {
    const response = await fetch(`/api/guests?eventId=${encodeURIComponent(eventId)}`);
    const result = await response.json();
    if (!result.success) {
      return { success: false, error: result.error || "Failed to load ticket types" };
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Upload event image with new schema
export async function uploadEventImageNew(imageFile, userId) {
  try {
    const fileName = `events/${userId}/${generateUniqueFilename()}_${
      imageFile.name
    }`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("event_images")
      .upload(fileName, imageFile, {
        cacheControl: "3600",
        upsert: false,
        metadata: {
          owner: userId,
        },
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("event_images")
      .getPublicUrl(fileName);

    // Save image record to database
    const { data: imageData, error: imageError } = await supabase
      .from("images")
      .insert([
        {
          user_id: userId,
          file_name: fileName,
          file_path: urlData.publicUrl,
          file_size: imageFile.size,
          mime_type: imageFile.type,
          is_public: true,
        },
      ])
      .select();

    if (imageError) {
      return { success: false, error: imageError.message };
    }

    return { success: true, image_id: imageData[0].id, url: urlData.publicUrl };
  } catch (error) {
    return { success: false, error: error.message };
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

// Update event
export async function updateEvent(eventId, updateData) {
  try {
    const { data, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", eventId)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Delete event (Kit service-role path after 3.2 RLS harden)
export async function deleteEvent(eventId) {
  try {
    const response = await fetch(`/api/events/${eventId}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper function to try to authenticate user for database operations
async function authenticateUserForDatabase(userData) {
  try {
    // If we have a wallet address, try to get the user from web3_users table
    if (userData.wallet_address) {
      try {
        const { data: web3User, error } = await supabase
          .from("web3_users")
          .select("id, wallet_address, username, display_name")
          .eq("wallet_address", userData.wallet_address)
          .single();

        if (!error && web3User) {
          return {
            success: true,
            user: web3User,
          };
        }
      } catch (queryError) {
        // Continue to fallback logic
      }
    }

    // If we have a user ID, try to get the user
    if (userData.id) {
      try {
        const { data: user, error } = await supabase
          .from("web3_users")
          .select("id, wallet_address, username, display_name")
          .eq("id", userData.id)
          .single();

        if (!error && user) {
          return {
            success: true,
            user: user,
          };
        }
      } catch (queryError) {
        // Continue to fallback logic
      }
    }

    // If all queries fail, return the original user data as fallback
    return {
      success: false,
      error: "User not found in database, using provided data",
      fallbackData: userData,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: error.message,
      fallbackData: userData,
    };
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

