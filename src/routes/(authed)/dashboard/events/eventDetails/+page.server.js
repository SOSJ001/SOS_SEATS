import { getServerSupabase } from "$lib/server/db";
import { getOrganiserNleBalance } from "$lib/server/payments";

const supabase = getServerSupabase();

export async function load({ url, locals }) {
  const eventId = url.searchParams.get("id");
  const tabParam = url.searchParams.get("tab") || "overview";
  const tab = ["overview", "guests", "generate"].includes(tabParam)
    ? tabParam
    : "overview";

  if (!eventId) {
    return {
      status: 400,
      error: "Event ID is required",
      tab,
      walletBalance: 0,
    };
  }

  try {
    const user_Id = locals.userId;

    if (!user_Id) {
      return {
        status: 401,
        error: "Unauthorized",
        tab,
        walletBalance: 0,
      };
    }

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

    if (eventError || !event) {
      return {
        status: 404,
        error: "Event not found",
        tab,
        walletBalance: 0,
      };
    }

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
      } catch {
        /* ignore */
      }
    }

    const { data: stats, error: statsError } = await supabase.rpc(
      "get_event_statistics",
      { p_event_id: eventId }
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
        remainingTickets: 0,
      };
    }

    let solanaRevenue = 0;
    let mobileMoneyRevenue = 0;
    const { data: paidOrders } = await supabase
      .from("orders")
      .select("total_amount, payment_method")
      .eq("event_id", eventId)
      .in("payment_status", ["paid", "completed"]);

    (paidOrders || []).forEach((order) => {
      const amount =
        typeof order.total_amount === "string"
          ? parseFloat(order.total_amount)
          : order.total_amount || 0;
      if (!isFinite(amount)) return;
      if (order.payment_method === "solana") {
        solanaRevenue += amount;
      } else if (
        order.payment_method === "orange_money" ||
        order.payment_method === "afrimoney"
      ) {
        mobileMoneyRevenue += amount;
      }
    });

    const { data: ticketTypeStats } = await supabase.rpc(
      "get_ticket_type_statistics",
      { p_event_id: eventId }
    );

    const totalCapacity =
      eventWithImage.ticket_types?.reduce(
        (sum, ticket) => sum + (ticket.quantity || 0),
        0
      ) || 0;

    eventStats.remainingTickets = totalCapacity - eventStats.totalTicketsSold;

    const walletAddress =
      locals.linkedWalletAddress || locals.walletAddress || null;
    let walletBalance = 0;
    try {
      walletBalance = await getOrganiserNleBalance(user_Id, walletAddress);
    } catch {
      walletBalance = 0;
    }

    let imageUrl = null;
    const rawImagePath =
      eventWithImage.image?.file_path ||
      eventWithImage.image?.url ||
      null;
    if (rawImagePath) {
      if (String(rawImagePath).startsWith("http")) {
        imageUrl = rawImagePath;
      } else {
        const { data: urlData } = supabase.storage
          .from("event_images")
          .getPublicUrl(rawImagePath);
        imageUrl = urlData?.publicUrl || rawImagePath;
      }
    }

    const formattedEvent = {
      id: eventWithImage.id,
      title: eventWithImage.name,
      date: formatEventDate(eventWithImage.date, eventWithImage.time),
      rawDate: eventWithImage.date,
      time: eventWithImage.time,
      location: eventWithImage.location,
      description: eventWithImage.description,
      image: imageUrl,
      status: eventWithImage.status,
      event_visibility: eventWithImage.event_visibility || "public",
      ticketDesignConfig: eventWithImage.ticket_design_config || null,
      ticketsSold: eventStats.totalTicketsSold,
      totalCapacity: totalCapacity,
      totalRevenue: eventStats.totalRevenue,
      solanaRevenue,
      mobileMoneyRevenue,
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
          let ticketTypeName = "Standard";
          if (guest.ticket_types?.name) {
            ticketTypeName = guest.ticket_types.name;
          } else if (guest.ticket_type_id && eventWithImage.ticket_types) {
            const ticketType = eventWithImage.ticket_types.find(
              (tt) => tt.id === guest.ticket_type_id
            );
            if (ticketType?.name) ticketTypeName = ticketType.name;
          }

          return {
            id: guest.id,
            name:
              guest.first_name && guest.last_name
                ? `${guest.first_name} ${guest.last_name}`
                : guest.first_name || guest.last_name || "Guest",
            email: guest.email || "",
            phone: guest.phone || "",
            ticketType: ticketTypeName,
            ticketNumber: guest.ticket_number || "",
            status: guest.status,
            specialRequirements: guest.special_requirements || null,
            createdAt: guest.created_at || null,
          };
        }) || [],
    };

    // Newest guests first for list defaults
    formattedEvent.guests.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    return {
      event: formattedEvent,
      tab,
      walletBalance,
    };
  } catch {
    return {
      status: 500,
      error: "Internal server error",
      tab,
      walletBalance: 0,
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
