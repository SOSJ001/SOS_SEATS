// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import { sessionFromDb } from "$lib/store";
import { generateUniqueFilename } from "$lib/store";
import { env } from "$env/dynamic/public";

// Get environment variables
const supabaseUrl = env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export the anonymous key for use in non-authenticated operations
export const ANONYMOUS_KEY = supabaseAnonKey;

// Cache bust comment - updated to force browser refresh

//sign up function
export async function createAccount(email, password, userName, name) {
  const response = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        name: name,
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

// load event to the user table
export async function loadEventToTable(user_id) {
  let { data: events, error } = await supabase
    .from("event")
    .select("*")
    .eq("user_id", user_id);

  if (error) {
    return [];
  }

  // Use Promise.all to await all image requests
  const eventWithImages = await Promise.all(
    events.map(async (Event, i) => {
      const Images = await SelectImagePath(Event.imageId);
      return {
        Event: Event,
        // @ts-ignore
        Image: Images,
      };
    })
  );

  return eventWithImages;
}

// load event to marketplace table
export async function loadEventToMarketplaceTable(sth) {
  let { data: events, error } = await supabase
    .from("event")
    .select("*")
    .eq("audience", sth);

  if (error) {
    return [];
  }

  // Use Promise.all to await all image requests
  const eventWithImages = await Promise.all(
    events.map(async (Event, i) => {
      const Images = await SelectImagePath(Event.imageId);
      return {
        Event: Event,
        // @ts-ignore
        Image: Images,
      };
    })
  );

  return eventWithImages;
}
//update event table
export async function updateEventToTable(user_id, event_Id) {
  let { data: events, error } = await supabase
    .from("event")
    .select("*")
    .eq("user_id", user_id)
    .eq("imageId", event_Id);

  if (error) {
    return [];
  }

  const Images = await SelectImagePath(events[0].imageId);
  return {
    Event: events[0],
    // @ts-ignore
    Image: Images,
  };
}

// load seat to table function
// @ts-ignore
export async function loadSeatsToTable(EventId) {
  // @ts-ignore
  let { data: seat, error } = await supabase
    .from("seat")
    .select("*")

    // Filters
    .eq("eventid", EventId);

  if (error) {
    return null;
  } else {
    return seat;
  }
}

// SELECT IMAGE PATH FROM image Table
// @ts-ignore
async function SelectImagePath(imageId) {
  let { data: image, error } = await supabase
    .from("image")
    .select("*")
    .eq("id", imageId);

  if (error) {
    return null; // You should handle errors appropriately
  } else {
    // @ts-ignore
    const images = await GetImageUrl(image[0].fileName);
    return images;
  }

  // return image;
}

// get public url for the Event Image below
// @ts-ignore
async function GetImageUrl(fileName) {
  const { data } = supabase.storage
    .from("event_image") //Bucket id
    .getPublicUrl(fileName);
  return data.publicUrl;
}

// upload image function
// @ts-ignore
async function uploadEventImage(image, userId1) {
  const avatarFile = image.files[0];
  let flyerName = `public/${generateUniqueFilename() + avatarFile.name}`;
  // @ts-ignore
  //uploading the flyer for the event
  const { data, error } = await supabase.storage
    .from("event_image")
    .upload(`${flyerName}`, avatarFile, {
      cacheControl: "3600",
      upsert: false,
    });
  if (data) {
    //if the flyer is uploaded successfully insert the flyer name along side the userid into the image table
    const { data, error } = await supabase
      .from("image")
      .insert([{ fileName: flyerName, userId: userId1 }])
      .select();

    if (data) {
      // const imageId = data[0].id;
      return imageId;
    } else {
    }
  } else {
    return;
  }
}

// insert event function below
// @ts-ignore
export async function addEventFunction(
  eName,
  eDate,
  eVenue,
  Audience,
  file_input,
  userId
) {
  // upload the image first on success insert the event records
  const imageId = await uploadEventImage(file_input, userId);
  // @ts-ignore
  const response = await supabase
    .from("event")
    .insert([
      {
        name: eName,
        date: eDate,
        venue: eVenue,
        audience: Audience,
        imageId: imageId,
        user_id: userId,
      },
    ])
    .select();

  return response;
}

// insert into guest table
export async function insertIntoGuestTable(
  guestName,
  inviteCode,
  event_Id,
  IsMale
) {
  const response = await supabase
    .from("guest")
    .insert([
      {
        guestName: guestName,
        inviteCode: inviteCode,
        event_Id: event_Id,
        IsMale: IsMale,
      },
    ])
    .select();
  return response;
}

//load all guest rows
export async function loadGuestsRows(user_id) {
  try {
    // Use the database function that handles both Web3 and Orange Money users
    const { data: guests, error: guestsError } = await supabase.rpc(
      "get_guests_for_user",
      { user_id_param: user_id }
    );

    if (guestsError) {
      return { data: [], error: guestsError };
    }

    // The database function already returns all the data we need
    if (guests && guests.length > 0) {
      // Transform the data to match the expected format
      const transformedGuests = guests.map((guest) => {
        return {
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
          event_title: guest.event_name,
          event_date: guest.event_date,
          ticket_type: guest.ticket_type_name || "General",
          ticket_price: guest.ticket_type_price || 0,
          venue_section: guest.venue_section_name || null,
          special_requirements: guest.special_requirements,
          created_at: guest.created_at,
          order_number: guest.order_number || `GUEST-${guest.id}`,
          payment_method: guest.payment_method || "Free",
          payment_status: guest.payment_status || "Completed",
          current_owner: guest.current_owner,
          order_item_id: guest.order_item_id,
        };
      });

      return { data: transformedGuests, error: null };
    } else {
      return { data: [], error: null };
    }
  } catch (error) {
    return { data: [], error: error.message };
  }
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

//get the total gender
export async function GetGender(IsMale, event_Id) {
  let response = await supabase
    .from("guest")
    .select("*")
    .eq("IsMale", IsMale)
    .eq("event_Id", event_Id);

  return response;
}

//get total Guests attended
export async function GetTotalAttended(verified, event_Id) {
  let response = await supabase
    .from("guest")
    .select("*")
    .eq("verified", verified)
    .eq("event_Id", event_Id);

  return response;
}

//get Total Gender attended
export async function GetTotalGenderAttended(IsMale, event_Id, verified) {
  let response = await supabase
    .from("guest")
    .select("*")
    .eq("IsMale", IsMale)
    .eq("event_Id", event_Id)
    .eq("verified", verified);

  return response;
}

// Load user events for event selector
export async function loadUserEventsForSelector(userId) {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("id, name, date")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      return { data: [], error };
    }

    // Transform to match expected format
    const transformedEvents = events.map((event) => ({
      id: event.id,
      title: event.name, // Map name to title for compatibility
      date: event.date,
    }));

    return { data: transformedEvents, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
}
//Scan guest invite
export async function scanGuestInvite(inviteCode, event_Id) {
  let response = await supabase
    .from("guest")
    .select("*")
    .eq("inviteCode", inviteCode)
    .eq("event_Id", event_Id);
  return response;
}

//Update guest invite
export async function updateGuestInvite(guestId) {
  let response = await supabase
    .from("guest")
    .update({ verifiedTime: new Date(Date.now()), verified: true })
    .eq("id", guestId)
    .select();

  if (!response.error) {
    response;
    return response;
  } else {
    // update time error
  }
}

//Delete guests
export async function removeGuest(guest_id) {
  const { error } = await supabase.from("guest").delete().eq("id", guest_id);
  return error;
}

export async function removeEvent(id) {
  const { error } = await supabase.from("event").delete().eq("id", id);
  return error;
}

export async function placeSeatOrder(eventid, Area, maxSeat, ticketPrice) {
  const response = await supabase
    .from("seat")
    .insert([
      {
        eventid: eventid,
        Area: Area,
        maxSeat: maxSeat,
        ticketPrice: ticketPrice || 0,
      },
    ])
    .select();
  return response;
}

// get order history
export async function orderHistory(user_id) {
  let response = await supabase
    .from("orderhistory")
    .select("*")
    .eq("user_id", user_id);
  return response;
}

//store wallet
export async function storeWallet(user_id, wallet, publicKey) {
  const response = await supabase
    .from("wallet")
    .insert([{ user_id: user_id, wallet: wallet, publicKey: publicKey }])
    .select();
  return response;
}

//select specific users and publickey
export async function usersAndPublickeys(user_id) {
  const response = await supabase
    .from("userandpublickey")
    .select("*")
    .eq("id", user_id);
  return response;
}

//search all the usersname and publickey
export async function searchWalletAndUserName() {
  const response = await supabase.from("userandpublickey").select("*");
  return response;
}

//call this in the server to get the signature
export async function signTransactionKey(user_id) {
  const response = await supabase
    .from("wallet")
    .select("*")
    .eq("user_id", user_id);
  return response;
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

// Update Web3 user profile
export async function updateWeb3UserProfile(
  walletAddress,
  username = null,
  displayName = null,
  avatarUrl = null
) {
  try {
    const { data, error } = await supabase.rpc("update_web3_user_profile", {
      wallet_address_param: walletAddress,
      username_param: username,
      display_name_param: displayName,
      avatar_url_param: avatarUrl,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data && data.length > 0 && data[0].success) {
      return { success: true, error: null };
    }

    return {
      success: false,
      error: data?.[0]?.message || "Failed to update profile",
    };
  } catch (error) {
    return { success: false, error: error.message };
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

// Create Web3 session (sets cookie via API)
export async function createWeb3Session(walletAddress, userData) {
  try {
    const sessionData = {
      type: "web3",
      wallet_address: walletAddress,
      user: userData,
      created_at: new Date().toISOString(),
    };

    const response = await fetch("/web3LoginApi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionData }),
    });

    if (response.ok) {
      // Update the session store to match traditional auth
      sessionFromDb.set(userData.id);
      return { success: true, error: null };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
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

// Verify Web3 session on page load
export async function verifyWeb3Session() {
  try {
    const response = await fetch("/web3VerifyApi", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.valid && data.user) {
        // Update session store
        sessionFromDb.set(data.user.id);
        return { success: true, user: data.user, error: null };
      }
    }

    return { success: false, user: null, error: "Invalid session" };
  } catch (error) {
    return { success: false, user: null, error: error.message };
  }
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

export async function createEventWithDetails(eventData, userId) {
  try {
    const {
      name,
      description,
      date,
      time,
      location,
      venue_address,
      category,
      tags,
      organizer,
      contact_email,
      website,
      social_media,
      image_id,
      is_free_event,
      seating_type,
      total_capacity,
      audience_type,
      event_visibility,
      status,
      ticket_types,
      venue_sections,
      seating_options,
    } = eventData;

    const functionParams = {
      p_user_id: userId,
      p_name: name,
      p_description: description,
      p_date: date,
      p_time: time,
      p_location: location,
      p_venue_address: venue_address,
      p_category: category,
      p_tags: tags,
      p_organizer: organizer,
      p_contact_email: contact_email,
      p_website: website,
      p_social_media: social_media,
      p_image_id: image_id,
      p_is_free_event: is_free_event,
      p_seating_type: seating_type,
      p_total_capacity: total_capacity,
      p_audience_type: audience_type,
      p_event_visibility: event_visibility,
      p_status: status || "draft",
      p_ticket_types: ticket_types,
      p_venue_sections: venue_sections,
      p_seating_options: seating_options,
    };

    const { data, error } = await supabase.rpc(
      "create_event_with_details",
      functionParams
    );

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      event_id: data[0].event_id,
      message: data[0].message,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Load all public events for marketplace
export async function loadPublicEvents() {
  try {
    // Now try the full query without joins first
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
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
        let imageUrl =
          "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop";
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

// Load events for a user using the new schema
export async function loadUserEvents(userId, sessionType = "traditional") {
  try {
    // Query events for the user directly
    const { data: events, error } = await supabase
      .from("events")
      .select(
        `
        *,
        ticket_types(*),
        venue_sections(*),
        seating_options(*)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    // Load images and real-time statistics for each event
    const eventsWithImagesAndStats = await Promise.all(
      events.map(async (event) => {
        let eventWithImage = event;

        // Load image data if event has an image_id
        if (event.image_id) {
          try {
            const { data: imageData, error: imageError } = await supabase
              .from("images")
              .select("*")
              .eq("id", event.image_id)
              .single();

            if (!imageError && imageData) {
              eventWithImage = { ...event, image: imageData };
            }
          } catch (imageError) {}
        }

        // Get real-time statistics for this event
        try {
          const { data: stats, error: statsError } = await supabase.rpc(
            "get_event_statistics",
            {
              p_event_id: event.id,
            }
          );

          if (!statsError && stats && stats.length > 0) {
            const statistics = stats[0];
            eventWithImage = {
              ...eventWithImage,
              realTimeStats: {
                totalTicketsSold: statistics.total_tickets_sold || 0,
                totalRevenue: statistics.total_revenue || 0,
                attendeesCheckedIn: statistics.checked_in_guests || 0,
                totalGuests: statistics.total_guests || 0,
              },
            };
          }
        } catch (statsError) {
          // If stats fail, continue without them
          eventWithImage = {
            ...eventWithImage,
            realTimeStats: {
              totalTicketsSold: 0,
              totalRevenue: 0,
              attendeesCheckedIn: 0,
              totalGuests: 0,
            },
          };
        }

        return eventWithImage;
      })
    );

    return eventsWithImagesAndStats;
  } catch (error) {
    return [];
  }
}

// Get event statistics
export async function getEventStatistics(eventId) {
  try {
    const { data, error } = await supabase.rpc("get_event_statistics", {
      p_event_id: eventId,
    });

    if (error) {
      return null;
    }

    return data[0];
  } catch (error) {
    return null;
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

// Add guest to event
export async function addGuestToEvent(eventId, guestData) {
  try {
    const { data, error } = await supabase
      .from("guests")
      .insert([
        {
          event_id: eventId,
          ticket_type_id: guestData.ticket_type_id,
          venue_section_id: guestData.venue_section_id,
          first_name: guestData.first_name,
          last_name: guestData.last_name,
          email: guestData.email,
          phone: guestData.phone,
          wallet_address: guestData.wallet_address,
          ticket_number: guestData.ticket_number,
          seat_number: guestData.seat_number,
          status: guestData.status || "pending",
          special_requirements: guestData.special_requirements,
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

// Check in guest
export async function checkInGuest(guestId, checkInLocation = null) {
  try {
    const { data, error } = await supabase.rpc("check_in_guest", {
      p_guest_id: guestId,
      p_check_in_location: checkInLocation,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: data[0].success, message: data[0].message };
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
          currency: orderData.currency || "USD",
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

// Load user orders
export async function loadUserOrders(userId, walletAddress = null) {
  try {
    // Determine the wallet address to use
    let walletAddressToUse = walletAddress;

    // If no wallet address provided but we have a user ID, use "anonymous" for Orange Money users
    if (!walletAddressToUse && userId) {
      walletAddressToUse = "anonymous";
    }

    if (walletAddressToUse) {
      const { data: walletOrders, error: walletError } = await supabase.rpc(
        "load_orders_by_wallet",
        { p_wallet_address: walletAddressToUse }
      );

      if (!walletError && walletOrders && walletOrders.length > 0) {
        // Transform the RPC result to match the expected format
        const ordersWithData = walletOrders.map((order) => {
          return {
            id: order.order_id,
            event_id: order.event_id,
            buyer_wallet_address: order.buyer_wallet_address,
            buyer_name: order.buyer_name,
            order_number: order.order_number,
            total_amount: order.total_amount,
            currency: order.currency,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            order_status: order.order_status,
            created_at: order.created_at,
            events: {
              name: order.event_name || "Unknown Event",
              date: order.event_date,
              location: order.event_location || "Unknown",
            },
            order_items: [
              {
                ticket_types: {
                  name: order.ticket_type_name || "Free Ticket",
                  price: order.ticket_type_price || 0,
                },
              },
            ],
          };
        });

        return ordersWithData;
      }
    }

    // Fallback to traditional query
    let query = supabase
      .from("orders")
      .select(
        `
        *,
        events(name, date, location),
        order_items(
          *,
          ticket_types(name, price),
          venue_sections(name, price),
          guests(first_name, last_name, email)
        )
      `
      )
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("buyer_id", userId);
    } else if (walletAddress) {
      query = query.eq("buyer_wallet_address", walletAddress);
    }

    const { data, error } = await query;

    if (error) {
      return [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

export async function listAllOrders() {
  try {
    const { data: orders, error } = await supabase.rpc("list_all_orders");
    return { orders, error };
  } catch (error) {
    return { orders: [], error };
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

// Generate ticket number
export async function generateTicketNumber() {
  try {
    const { data, error } = await supabase.rpc("generate_ticket_number");

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
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

    const { data: images, error: imageError } = await supabase
      .from("images")
      .select("*")
      .eq("id", eventData.image_id);

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
      images: images || [],
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

// Delete event
export async function deleteEvent(eventId) {
  try {
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
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

// Create paid ticket order (for Orange Money, card payments, etc.)
export async function createPaidTicketOrder(
  eventId,
  selectedTickets,
  userData,
  paymentInfo,
  ticketDetails = null
) {
  try {
    // Generate a unique order number
    const orderNumber = `PAID-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Calculate total amount and get ticket type details
    let totalAmount = 0;
    let ticketTypeDetails = [];

    // Use pre-processed ticketDetails if available, otherwise process selectedTickets
    if (ticketDetails && ticketDetails.length > 0) {
      ticketTypeDetails = ticketDetails;
      totalAmount = ticketDetails.reduce(
        (sum, ticket) => sum + ticket.price * ticket.quantity,
        0
      );
    } else {
      for (const [selectedTicketTypeId, quantity] of Object.entries(
        selectedTickets
      )) {
        if (quantity > 0) {
          const ticketTypeIdToUse =
            typeof selectedTicketTypeId === "string"
              ? selectedTicketTypeId
              : selectedTicketTypeId.toString();

          let { data: ticketType, error: ticketError } = await supabase
            .from("ticket_types")
            .select("*")
            .eq("id", ticketTypeIdToUse)
            .single();

          if (ticketError) {
            return {
              success: false,
              error: "Failed to get ticket type details",
            };
          }

          // Use actual price from database, convert to number if it's a string
          const ticketPrice =
            typeof ticketType.price === "string"
              ? parseFloat(ticketType.price)
              : ticketType.price;

          totalAmount += ticketPrice * quantity;
          ticketTypeDetails.push({
            id: ticketType.id,
            name: ticketType.name,
            price: ticketPrice,
            quantity: quantity,
          });
        }
      }
    }

    // Create the order with user data
    const orderData = {
      event_id: eventId,
      buyer_id: userData.id || null,
      buyer_wallet_address: userData.wallet_address || null,
      buyer_email: userData.email || null,
      buyer_name: userData.name || userData.display_name || "Anonymous",
      order_number: orderNumber,
      total_amount: paymentInfo.amount,
      currency: paymentInfo.currency || "USDC",
      payment_method: paymentInfo.paymentMethod,
      payment_status: "completed",
      transaction_hash: paymentInfo.transactionSignature,
      order_status: "confirmed",
    };

    // Try to authenticate user for database operations
    const authResult = await authenticateUserForDatabase(userData);
    if (authResult.success) {
      orderData.buyer_id = authResult.user.id;
      orderData.buyer_wallet_address = authResult.user.wallet_address;
      orderData.buyer_name =
        authResult.user.display_name || authResult.user.username;
    } else {
      // If authentication fails, use the provided user data directly
      const fallbackData = authResult.fallbackData || userData;
      orderData.buyer_wallet_address = fallbackData.wallet_address;
      orderData.buyer_name =
        fallbackData.name || fallbackData.display_name || "Anonymous";
    }

    // Create one order with multiple order items
    let orderId = null;
    let totalTicketsClaimed = 0;

    // Call the paid ticket order function
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "create_paid_ticket_order_with_items",
      {
        p_event_id: eventId,
        p_buyer_wallet_address: orderData.buyer_wallet_address || "anonymous",
        p_buyer_name: orderData.buyer_name,
        p_order_number: orderNumber,
        p_ticket_details: ticketTypeDetails,
        p_total_amount: paymentInfo.amount,
        p_currency: paymentInfo.currency || "USDC",
        p_transaction_hash: paymentInfo.transactionSignature,
        p_payment_method: paymentInfo.paymentMethod || "solana",
      }
    );

    if (rpcError) {
      console.error("createPaidTicketOrder - Function call error:", rpcError);
      return {
        success: false,
        error: `Database function error: ${rpcError.message}`,
      };
    }

    const paidResult = rpcResult;
    const paidError = rpcError;

    if (
      paidError ||
      !paidResult ||
      paidResult.length === 0 ||
      !paidResult[0].success
    ) {
      console.error(
        "createPaidTicketOrder - Paid ticket order creation failed:",
        {
          paidError,
          paidResult,
          orderData,
          ticketTypeDetails,
        }
      );

      // Check if it's a quantity error
      const errorMessage =
        paidResult?.[0]?.error_message ||
        paidError?.message ||
        "Failed to create paid ticket order";
      if (errorMessage.includes("Not enough tickets available")) {
        return {
          success: false,
          error:
            "Sorry, some tickets are no longer available. Please refresh the page and try again.",
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    // Success! Extract the order details
    const orderResult = paidResult[0];
    orderId = orderResult.order_id;
    totalTicketsClaimed = orderResult.tickets_claimed;

    return {
      success: true,
      orderId: orderId,
      totalTicketsClaimed: totalTicketsClaimed,
      orderNumber: orderNumber,
    };
  } catch (error) {
    console.error("createPaidTicketOrder - Error:", error);
    return {
      success: false,
      error: error.message || "Failed to create paid ticket order",
    };
  }
}

// Claim free tickets or paid tickets
export async function claimFreeTickets(
  eventId,
  selectedTickets,
  userData,
  paymentInfo = null
) {
  try {
    // Generate a unique order number
    const orderNumber = `${
      paymentInfo ? "PAID" : "FREE"
    }-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate total amount and get ticket type details
    let totalAmount = 0;
    let ticketTypeDetails = [];

    for (const [selectedTicketTypeId, quantity] of Object.entries(
      selectedTickets
    )) {
      if (quantity > 0) {
        const ticketTypeIdToUse =
          typeof selectedTicketTypeId === "string"
            ? selectedTicketTypeId
            : selectedTicketTypeId.toString();

        let { data: ticketType, error: ticketError } = await supabase
          .from("ticket_types")
          .select("*")
          .eq("id", ticketTypeIdToUse)
          .single();

        if (ticketError) {
          return {
            success: false,
            error: "Failed to get ticket type details",
          };
        }

        // Use actual price from database, convert to number if it's a string
        const ticketPrice =
          typeof ticketType.price === "string"
            ? parseFloat(ticketType.price)
            : ticketType.price;

        totalAmount += ticketPrice * quantity;
        ticketTypeDetails.push({
          id: ticketType.id,
          name: ticketType.name,
          price: ticketPrice,
          quantity: quantity,
        });
      }
    }

    // Create the order with Web3 user data
    const orderData = {
      event_id: eventId,
      buyer_id: userData.id || null,
      buyer_wallet_address: userData.wallet_address || null,
      buyer_email: userData.email || null,
      buyer_name: userData.name || userData.display_name || "Anonymous",
      order_number: orderNumber,
      total_amount: paymentInfo ? paymentInfo.amount : totalAmount,
      currency: paymentInfo ? paymentInfo.currency || "USDC" : "USD", // Use payment currency or default to USDC for paid tickets
      payment_method: paymentInfo ? paymentInfo.paymentMethod : "free",
      payment_status: paymentInfo ? "completed" : "completed",
      transaction_hash: paymentInfo ? paymentInfo.transactionSignature : null,
      order_status: "confirmed",
    };

    // Try to authenticate user for database operations
    const authResult = await authenticateUserForDatabase(userData);
    if (authResult.success) {
      orderData.buyer_id = authResult.user.id;
      orderData.buyer_wallet_address = authResult.user.wallet_address;
      orderData.buyer_name =
        authResult.user.display_name || authResult.user.username;
    } else {
      // If authentication fails, use the provided user data directly
      // Use fallback data if available, otherwise use original userData
      const fallbackData = authResult.fallbackData || userData;
      orderData.buyer_wallet_address = fallbackData.wallet_address;
      orderData.buyer_name =
        fallbackData.name || fallbackData.display_name || "Anonymous";
    }

    // For mobile money payments, use the buyerWallet from paymentInfo if available
    if (paymentInfo && paymentInfo.buyerWallet) {
      orderData.buyer_wallet_address = paymentInfo.buyerWallet;
    }

    // Create one order with multiple order items
    let orderId = null;
    let totalTicketsClaimed = 0;

    if (paymentInfo) {
      // Now try the RPC call with explicit parameter order
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "create_paid_ticket_order_with_items",
        {
          p_event_id: eventId,
          p_buyer_wallet_address:
            orderData.buyer_wallet_address || ANONYMOUS_KEY,
          p_buyer_name: orderData.buyer_name,
          p_order_number: orderNumber,
          p_ticket_details: ticketTypeDetails,
          p_total_amount: paymentInfo.amount,
          p_currency: paymentInfo.currency || "USDC",
          p_transaction_hash: paymentInfo.transactionSignature,
          p_payment_method: paymentInfo.paymentMethod || "solana",
        }
      );
      if (rpcError) {
        console.error("Function call error:", rpcError);
        return {
          success: false,
          error: `Database function error: ${rpcError.message}`,
        };
      }
      const paidResult = rpcResult;
      const paidError = rpcError;

      if (
        paidError ||
        !paidResult ||
        paidResult.length === 0 ||
        !paidResult[0].success
      ) {
        console.error("Paid ticket order creation failed:", {
          paidError,
          paidResult,
          orderData,
          ticketTypeDetails,
        });

        // Check if it's a quantity error
        const errorMessage =
          paidResult?.[0]?.error_message ||
          paidError?.message ||
          "Failed to create paid ticket order";
        if (errorMessage.includes("Not enough tickets available")) {
          return {
            success: false,
            error:
              "Sorry, some tickets are no longer available. Please refresh the page and try again.",
          };
        }

        return {
          success: false,
          error: errorMessage,
        };
      }
      orderId = paidResult[0].order_id;
      totalTicketsClaimed = paidResult[0].tickets_claimed;
    } else {
      // Use create_free_ticket_order for free tickets - create one order with multiple items
      const { data: freeResult, error: freeError } = await supabase.rpc(
        "create_free_ticket_order_with_items",
        {
          p_event_id: eventId,
          p_buyer_wallet_address: orderData.buyer_wallet_address,
          p_buyer_name: orderData.buyer_name,
          p_order_number: orderNumber,
          p_ticket_details: ticketTypeDetails,
        }
      );

      if (
        freeError ||
        !freeResult ||
        freeResult.length === 0 ||
        !freeResult[0].success
      ) {
        // Check if it's a quantity error
        const errorMessage =
          freeResult?.[0]?.error_message ||
          freeError?.message ||
          "Failed to create free ticket order";
        if (errorMessage.includes("Not enough tickets available")) {
          throw new Error(
            "Sorry, some tickets are no longer available. Please refresh the page and try again."
          );
        }

        throw new Error(errorMessage);
      }
      orderId = freeResult[0].order_id;
      totalTicketsClaimed = freeResult[0].tickets_claimed;
    }

    // If we successfully created the order
    if (orderId && totalTicketsClaimed > 0) {
      return {
        success: true,
        orderId: orderId,
        orderNumber: orderNumber,
        ticketsClaimed: totalTicketsClaimed,
        message: `Successfully claimed ${totalTicketsClaimed} ticket(s)`,
      };
    } else {
      return {
        success: false,
        error: "Failed to create order",
      };
    }
  } catch (error) {
    console.error("Error claiming tickets:", error);
    return {
      success: false,
      error: error.message || "Failed to claim tickets",
    };
  }
}

// Transfer a ticket to another wallet
export async function transferTicket(
  orderItemId,
  fromWallet,
  toWallet,
  reason = null
) {
  try {
    const { data, error } = await supabase.rpc("transfer_ticket", {
      p_order_item_id: orderItemId,
      p_from_wallet: fromWallet,
      p_to_wallet: toWallet,
      p_reason: reason,
    });

    if (error) {
      throw error;
    }

    // The database function returns a table with success and message
    // We need to check if the first row indicates success
    if (data && data.length > 0) {
      const result = data[0];

      if (result.success) {
        return { success: true, error: null, message: result.message };
      } else {
        return { success: false, error: result.message || "Transfer failed" };
      }
    } else {
      return { success: false, error: "No response from database" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Load tickets by current owner (including transferred tickets)
export async function loadTicketsByCurrentOwner(walletAddress) {
  try {
    const { data, error } = await supabase.rpc(
      "load_tickets_by_current_owner",
      {
        p_wallet_address: walletAddress,
      }
    );

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error loading tickets by current owner:", error);
    return { data: null, error: error.message };
  }
}

// Validate and check in a ticket by wallet address (QR code)
export async function validateAndCheckInTicket(
  walletAddress,
  eventId,
  checkInLocation = null
) {
  try {
    const { data, error } = await supabase.rpc("validate_and_check_in_ticket", {
      p_wallet_address: walletAddress,
      p_event_id: eventId,
      p_check_in_location: checkInLocation,
    });

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        success: result.success,
        message: result.message,
        ticketInfo: result.ticket_info,
        error: null,
      };
    } else {
      return {
        success: false,
        message: "No response from database",
        ticketInfo: null,
        error: "No response from database",
      };
    }
  } catch (error) {
    console.error("Error in validateAndCheckInTicket:", error);
    return {
      success: false,
      message: error.message || "Validation failed",
      ticketInfo: null,
      error: error.message,
    };
  }
}

// Web3 Auth Helper Functions
export function extractWeb3UserId(web3Session) {
  try {
    if (!web3Session) return null;

    const sessionData = JSON.parse(web3Session);

    if (sessionData.user && sessionData.user.id) {
      return sessionData.user.id;
    }

    return null;
  } catch (error) {
    return null;
  }
}

export function extractTraditionalUserId(userSession) {
  try {
    if (!userSession) return null;

    const sessionData = JSON.parse(userSession);

    if (sessionData.id) {
      return sessionData.id;
    }

    return null;
  } catch (error) {
    return null;
  }
}

export function getUserIdFromCookies(cookies) {
  // Try traditional session first
  const traditionalUserId = extractTraditionalUserId(
    cookies.get("userSession")
  );
  if (traditionalUserId) return traditionalUserId;

  // Try Web3 session
  const web3UserId = extractWeb3UserId(cookies.get("web3Session"));
  if (web3UserId) return web3UserId;

  // BYPASS: Return test user ID for development
  return "66c0a293-b150-4847-9c44-a376d27e4de3";
}

// Bypass function for development - uses direct SQL to get around RLS
export async function loadGuestsRowsBypass(user_id) {
  try {
    // Use direct SQL to bypass RLS
    const { data: guests, error: guestsError } = await supabase.rpc(
      "get_guests_for_user",
      {
        user_id_param: user_id,
      }
    );

    if (guestsError) {
      console.error("loadGuestsRowsBypass: Database error:", guestsError);
      return { data: [], error: guestsError };
    }

    if (guests && guests.length > 0) {
      // Transform the data to match the expected format
      const transformedGuests = guests.map((guest) => {
        // The bypass function should already return current_owner from the database function
        const currentOwner = guest.current_owner || guest.wallet_address;

        return {
          id: guest.id,
          name: `${guest.first_name} ${guest.last_name}`,
          email: guest.email,
          status: guest.status, // Keep original status
          avatar:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2MzY2ZjEiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgNC44MyAyLjE2IDQuODMgNC44M1MxNC42NyAxNC42NyAxMiAxNC42N1M3LjE3IDEyLjUxIDcuMTcgOS44M1M5LjMzIDUgMTIgNXptMCAxMmM0LjQyIDAgOC4xNy0yLjE2IDEwLjQyLTUuNDJDMjAuMTUgMTUuNjYgMTYuNDIgMTggMTIgMThzLTguMTUtMi4zNC0xMC40Mi01LjQyQzMuODMgMTQuODQgNy41OCAxNyAxMiAxN3oiLz4KPC9zdmc+Cjwvc3ZnPgo=",
          ticket_number:
            guest.order_item_id ||
            guest.ticket_number ||
            `TIX-${guest.id?.slice(0, 8)}`, // Use order_item_id as ticket number, fallback to ticket_number or generated ID
          phone: guest.phone,
          wallet_address: currentOwner, // Use current owner instead of original buyer
          seat_number: guest.seat_number,
          check_in_time: guest.check_in_time,
          event_id: guest.event_id,
          event_title: guest.event_name || "Unknown Event",
          event_date: guest.event_date || null,
          ticket_type: guest.ticket_type_name || "General",
          ticket_price: guest.ticket_type_price || 0,
          venue_section: guest.venue_section_name || null,
          special_requirements: guest.special_requirements,
          created_at: guest.created_at,
          order_number: guest.order_number || `GUEST-${guest.id}`,
          payment_method: guest.payment_method || "Free",
          payment_status: guest.payment_status || "Completed",
          // Add original fields for client-side processing
          first_name: guest.first_name,
          last_name: guest.last_name,
          current_owner: guest.current_owner,
          ticket_type_name: guest.ticket_type_name,
          ticket_type_price: guest.ticket_type_price,
          venue_section_name: guest.venue_section_name,
          event_name: guest.event_name,
          order_item_id: guest.order_item_id, // Include order_item_id
        };
      });

      return { data: transformedGuests, error: null };
    } else {
      return { data: [], error: null };
    }
  } catch (error) {
    console.error("loadGuestsRowsBypass: Exception:", error);
    return { data: [], error: error.message };
  }
}
