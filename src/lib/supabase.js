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
      type: 'web3',
      wallet_address: walletAddress,
      user: userData,
      created_at: new Date().toISOString()
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
