// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import { sessionFromDb } from "$lib/store";
import { generateUniqueFilename } from "$lib/store";

// Get environment variables
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://qwoklzpfoblqmnategny.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2tsenBmb2JscW1uYXRlZ255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTIzMDYxMDksImV4cCI6MjAwNzg4MjEwOX0.BktZ0VzqqY5Wn8wjXfgIKBMdNauNx5-ZChMOnw9vbcs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    console.log("loadEventToTable error", error.message);
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
    console.log("loadEventToTable error", error.message);
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
    console.log("loadEventToTable error", error.message);
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
    console.error("Error selecting image path:", error.message);
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
      // console.log("Upload success ", data[0].id);
      const imageId = data[0].id;
      return imageId;
    } else {
      console.log("Insert Image Error ", error.message);
    }
  } else {
    console.log("Error Uploading Image ", error.message);
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
  let response = await supabase
    .from("usereventandguest")
    .select("*")
    .eq("user_id", user_id);
  return response;
}
//load Specific Event's guest rows
export async function loadEventGuestsRows(event_id) {
  let response = await supabase
    .from("usereventandguest")
    .select("*")
    .eq("event_id", event_id);
  return response;
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
    console.log(response.error.message);
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
      console.error("Error checking wallet:", error);
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
    console.error("Error in checkWalletExists:", error);
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
      console.error("Error creating Web3 user:", error);
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
    console.error("Error in createWeb3User:", error);
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
      console.error("Error recording sign in:", error);
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
    console.error("Error in recordWeb3SignIn:", error);
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
      console.error("Error updating profile:", error);
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
    console.error("Error in updateWeb3UserProfile:", error);
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
      console.error("Error getting profile:", error);
      return { success: false, user: null, error: error.message };
    }

    return { success: true, user: data, error: null };
  } catch (error) {
    console.error("Error in getWeb3UserProfile:", error);
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
    console.error("Error creating Web3 session:", error);
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
    console.error("Error clearing Web3 session:", error);
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
    console.error("Error verifying Web3 session:", error);
    return { success: false, user: null, error: error.message };
  }
}

// =====================================================
// NEW EVENT MANAGEMENT FUNCTIONS FOR UPDATED SCHEMA
// =====================================================

// Create a new event with all details using the new schema
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
      ticket_types,
      venue_sections,
      seating_options,
    } = eventData;

    const { data, error } = await supabase.rpc("create_event_with_details", {
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
      p_ticket_types: ticket_types,
      p_venue_sections: venue_sections,
      p_seating_options: seating_options,
    });

    if (error) {
      console.error("Error creating event:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      event_id: data[0].event_id,
      message: data[0].message,
    };
  } catch (error) {
    console.error("Error in createEventWithDetails:", error);
    return { success: false, error: error.message };
  }
}

// Load events for a user using the new schema
export async function loadUserEvents(userId, sessionType = 'traditional') {
  try {
    console.log(`Loading events for user: ${userId}, session type: ${sessionType}`);
    
    let eventsQuery = supabase
      .from("events")
      .select(
        `
        *,
        ticket_types(*),
        venue_sections(*),
        seating_options(*)
      `
      )
      .order("created_at", { ascending: false });

    // Handle different user types
    if (sessionType === 'web3') {
      // For Web3 users, we need to join with web3_users table
      eventsQuery = eventsQuery.eq("user_id", userId);
    } else {
      // For traditional users, use the user_id directly
      eventsQuery = eventsQuery.eq("user_id", userId);
    }

    const { data: events, error } = await eventsQuery;
    
    console.log(`Found ${events?.length || 0} events for user ${userId}`);
    if (error) {
      console.error("Supabase error:", error);
    }

    if (error) {
      console.error("Error loading user events:", error);
      return [];
    }

    // Load images separately for each event that has an image_id
    const eventsWithImages = await Promise.all(
      events.map(async (event) => {
        if (event.image_id) {
          try {
            const { data: imageData, error: imageError } = await supabase
              .from("images")
              .select("*")
              .eq("id", event.image_id)
              .single();

            if (!imageError && imageData) {
              return { ...event, image: imageData };
            }
          } catch (imageError) {
            console.error("Error loading image for event:", imageError);
          }
        }
        return event;
      })
    );

    return eventsWithImages;
  } catch (error) {
    console.error("Error in loadUserEvents:", error);
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
      console.error("Error getting event statistics:", error);
      return null;
    }

    return data[0];
  } catch (error) {
    console.error("Error in getEventStatistics:", error);
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
      console.error("Error updating event status:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Error in updateEventStatus:", error);
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
      console.error("Error adding guest:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Error in addGuestToEvent:", error);
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
      console.error("Error checking in guest:", error);
      return { success: false, error: error.message };
    }

    return { success: data[0].success, message: data[0].message };
  } catch (error) {
    console.error("Error in checkInGuest:", error);
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
      console.error("Error loading event guests:", error);
      return [];
    }

    return guests;
  } catch (error) {
    console.error("Error in loadEventGuests:", error);
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
      console.error("Error creating order:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Error in createOrder:", error);
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
    }));

    const { data, error } = await supabase
      .from("order_items")
      .insert(orderItems)
      .select();

    if (error) {
      console.error("Error adding order items:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in addOrderItems:", error);
    return { success: false, error: error.message };
  }
}

// Load user orders
export async function loadUserOrders(userId, walletAddress = null) {
  try {
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
      console.error("Error loading user orders:", error);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error in loadUserOrders:", error);
    return [];
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
      });

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
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
      console.error("Error saving image record:", imageError);
      return { success: false, error: imageError.message };
    }

    return { success: true, image_id: imageData[0].id, url: urlData.publicUrl };
  } catch (error) {
    console.error("Error in uploadEventImageNew:", error);
    return { success: false, error: error.message };
  }
}

// Generate ticket number
export async function generateTicketNumber() {
  try {
    const { data, error } = await supabase.rpc("generate_ticket_number");

    if (error) {
      console.error("Error generating ticket number:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in generateTicketNumber:", error);
    return null;
  }
}

// Get event by ID with all related data
export async function getEventById(eventId) {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        ticket_types(*),
        venue_sections(*),
        seating_options(*),
        images(*)
      `
      )
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("Error getting event:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getEventById:", error);
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
      console.error("Error updating event:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Error in updateEvent:", error);
    return { success: false, error: error.message };
  }
}

// Delete event
export async function deleteEvent(eventId) {
  try {
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) {
      console.error("Error deleting event:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteEvent:", error);
    return { success: false, error: error.message };
  }
}
