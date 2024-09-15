// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import { sessionFromDb } from "$lib/store";
import { generateUniqueFilename } from "$lib/store.js";
export const supabase = createClient(
  "https://qwoklzpfoblqmnategny.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2tsenBmb2JscW1uYXRlZ255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTIzMDYxMDksImV4cCI6MjAwNzg4MjEwOX0.BktZ0VzqqY5Wn8wjXfgIKBMdNauNx5-ZChMOnw9vbcs"
);

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
    Image: Images
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
export async function insertIntoGuestTable(guestName, inviteCode, event_Id) {
  const response = await supabase
    .from("guest")
    .insert([
      { guestName: guestName, inviteCode: inviteCode, event_Id: event_Id },
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

//Delete guests
export async function removeGuest(guest_id) {
  const { error } = await supabase.from("guest").delete().eq("id", guest_id);
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
