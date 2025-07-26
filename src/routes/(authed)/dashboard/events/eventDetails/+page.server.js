import { supabase } from "$lib/supabase.js";
import { validateSession } from "$lib/sessionUtils.js";

export async function load({ url, cookies }) {
  const eventId = url.searchParams.get("id");

  if (!eventId) {
    return {
      status: 400,
      error: "Event ID is required",
    };
  }

  try {
    // Get the current user from session cookies
    const { valid, user_Id, sessionType } = validateSession(cookies);

    if (!valid || !user_Id) {
      return {
        status: 401,
        error: "Unauthorized",
      };
    }

    // Fetch the specific event with all its details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        `
        *,
        ticket_types (*),
        guests (*)
      `
      )
      .eq("id", eventId)
      .eq("user_id", user_Id)
      .single();

    if (eventError) {
      console.error("Error fetching event:", eventError);
      return {
        status: 404,
        error: "Event not found",
      };
    }

    if (!event) {
      return {
        status: 404,
        error: "Event not found",
      };
    }

    // Load image data if event has an image_id
    let eventWithImage = event;
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
      } catch (imageError) {
        console.error("Error loading image for event:", imageError);
      }
    }

    // Calculate metrics
    const totalTicketsSold =
      eventWithImage.ticket_types?.reduce(
        (sum, ticket) => sum + (ticket.sold_quantity || 0),
        0
      ) || 0;
    const totalRevenue =
      eventWithImage.ticket_types?.reduce(
        (sum, ticket) =>
          sum + (ticket.price || 0) * (ticket.sold_quantity || 0),
        0
      ) || 0;
    const totalCapacity =
      eventWithImage.ticket_types?.reduce(
        (sum, ticket) => sum + (ticket.quantity || 0),
        0
      ) || 0;
    const remainingTickets = totalCapacity - totalTicketsSold;
    const attendeesCheckedIn =
      eventWithImage.guests?.filter((guest) => guest.status === "checked_in")
        .length || 0;

    // Format the event data for the frontend
    const formattedEvent = {
      id: eventWithImage.id,
      title: eventWithImage.name,
      date: formatEventDate(eventWithImage.date, eventWithImage.time),
      time: eventWithImage.time,
      location: eventWithImage.location,
      description: eventWithImage.description,
      image:
        eventWithImage.image?.file_path ||
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop",
      status: eventWithImage.status,
      ticketsSold: totalTicketsSold,
      totalCapacity: totalCapacity,
      totalRevenue: totalRevenue,
      attendeesCheckedIn: attendeesCheckedIn,
      remainingTickets: remainingTickets,
      ticketTypes:
        eventWithImage.ticket_types?.map((ticket) => ({
          id: ticket.id,
          name: ticket.name,
          price: ticket.price,
          sold: ticket.sold_quantity || 0,
          remaining: (ticket.quantity || 0) - (ticket.sold_quantity || 0),
          quantity: ticket.quantity || 0,
        })) || [],
      guests:
        eventWithImage.guests?.map((guest) => ({
          id: guest.id,
          name: guest.name,
          ticketType: guest.ticket_type,
          status: guest.status,
          avatar:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
          statusColor:
            guest.status === "checked_in"
              ? "text-green-400"
              : "text-yellow-400",
        })) || [],
    };

    return {
      event: formattedEvent,
    };
  } catch (error) {
    console.error("Server error:", error);
    return {
      status: 500,
      error: "Internal server error",
    };
  }
}

function formatEventDate(date, time) {
  if (!date) return "Date not set";
  const eventDate = new Date(date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return time ? `${formattedDate} at ${time}` : formattedDate;
}
