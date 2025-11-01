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
        guests (
          *,
          ticket_types (
            id,
            name
          )
        )
      `
      )
      .eq("id", eventId)
      .eq("user_id", user_Id)
      .single();

    if (eventError) {
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
      } catch (imageError) {}
    }

    // Get real-time event statistics using the database function
    const { data: stats, error: statsError } = await supabase.rpc(
      "get_event_statistics",
      {
        p_event_id: eventId,
      }
    );

    let eventStats = {
      totalTicketsSold: 0,
      totalRevenue: 0,
      attendeesCheckedIn: 0,
      remainingTickets: 0,
    };

    if (!statsError && stats && stats.length > 0) {
      const statistics = stats[0];
      eventStats = {
        totalTicketsSold: statistics.total_tickets_sold || 0,
        totalRevenue: statistics.total_revenue || 0,
        attendeesCheckedIn: statistics.checked_in_guests || 0,
        remainingTickets: 0, // Will calculate below
      };
    }

    // Get real-time ticket type statistics
    const { data: ticketTypeStats, error: ticketStatsError } =
      await supabase.rpc("get_ticket_type_statistics", {
        p_event_id: eventId,
      });

    // Calculate total capacity and remaining tickets from ticket types
    const totalCapacity =
      eventWithImage.ticket_types?.reduce(
        (sum, ticket) => sum + (ticket.quantity || 0),
        0
      ) || 0;

    eventStats.remainingTickets = totalCapacity - eventStats.totalTicketsSold;

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
      ticketsSold: eventStats.totalTicketsSold,
      totalCapacity: totalCapacity,
      totalRevenue: eventStats.totalRevenue,
      attendeesCheckedIn: eventStats.attendeesCheckedIn,
      remainingTickets: eventStats.remainingTickets,
      ticketTypes:
        ticketTypeStats?.map((ticket) => ({
          id: ticket.ticket_type_id,
          name: ticket.ticket_name,
          price: ticket.ticket_price,
          sold: ticket.sold_quantity || 0,
          remaining: ticket.remaining_quantity || 0,
          quantity: ticket.total_quantity || 0,
        })) ||
        eventWithImage.ticket_types?.map((ticket) => ({
          id: ticket.id,
          name: ticket.name,
          price: ticket.price,
          sold: ticket.sold_quantity || 0,
          remaining: (ticket.quantity || 0) - (ticket.sold_quantity || 0),
          quantity: ticket.quantity || 0,
        })) ||
        [],
      guests:
        eventWithImage.guests?.map((guest) => {
          // Get ticket type name from nested relationship or fallback to lookup
          let ticketTypeName = "Standard";
          if (guest.ticket_types?.name) {
            ticketTypeName = guest.ticket_types.name;
          } else if (guest.ticket_type_id && eventWithImage.ticket_types) {
            const ticketType = eventWithImage.ticket_types.find(
              (tt) => tt.id === guest.ticket_type_id
            );
            if (ticketType?.name) {
              ticketTypeName = ticketType.name;
            }
          }
          
          return {
            id: guest.id,
            name: guest.first_name && guest.last_name
              ? `${guest.first_name} ${guest.last_name}`
              : guest.first_name || guest.last_name || "Guest",
            ticketType: ticketTypeName,
            status: guest.status,
            avatar:
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
            statusColor:
              guest.status === "checked_in" || guest.status === "checked-in"
                ? "text-green-400"
                : "text-yellow-400",
          };
        }) || [],
    };

    return {
      event: formattedEvent,
    };
  } catch (error) {
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
