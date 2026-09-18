/**
 * Rebuild server domain: events (roadmap 3.2).
 * Kit-privileged event I/O via getServerSupabase after cookie authz.
 * Do not import from client components.
 */
import { getServerSupabase } from "$lib/server/db";
import { generateUniqueFilename } from "$lib/store";

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString();
}

export async function uploadEventImage(
  imageFile: File | Blob,
  userId: string,
  fileNameHint = "event-image.jpg"
): Promise<
  | { success: true; image_id: string; url: string }
  | { success: false; error: string }
> {
  try {
    const db = getServerSupabase();
    const name =
      imageFile instanceof File && imageFile.name
        ? imageFile.name
        : fileNameHint;
    const fileName = `events/${userId}/${generateUniqueFilename()}_${name}`;
    const mimeType =
      imageFile instanceof File && imageFile.type
        ? imageFile.type
        : "image/jpeg";
    const fileSize =
      imageFile instanceof File ? imageFile.size : (imageFile as Blob).size;

    const { error: uploadError } = await db.storage
      .from("event_images")
      .upload(fileName, imageFile, {
        cacheControl: "3600",
        upsert: false,
        metadata: { owner: userId },
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = db.storage
      .from("event_images")
      .getPublicUrl(fileName);

    const { data: imageData, error: imageError } = await db
      .from("images")
      .insert([
        {
          user_id: userId,
          file_name: fileName,
          file_path: urlData.publicUrl,
          file_size: fileSize,
          mime_type: mimeType,
          is_public: true,
        },
      ])
      .select();

    if (imageError) {
      return { success: false, error: imageError.message };
    }

    return {
      success: true,
      image_id: imageData[0].id,
      url: urlData.publicUrl,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Upload failed" };
  }
}

export async function createEventWithDetails(
  eventData: Record<string, any>,
  userId: string
): Promise<
  | { success: true; event_id: string; message?: string }
  | { success: false; error: string }
> {
  try {
    const db = getServerSupabase();
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
      ticket_design_config,
      ticket_types,
      venue_sections,
      seating_options,
    } = eventData;

    const { data, error } = await db.rpc("create_event_with_details", {
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
      p_ticket_design_config: ticket_design_config,
      p_ticket_types: ticket_types,
      p_venue_sections: venue_sections,
      p_seating_options: seating_options,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      event_id: data[0].event_id,
      message: data[0].message,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Create failed" };
  }
}

export async function updateEventWithDetails(
  eventId: string,
  eventData: Record<string, any>,
  userId: string,
  fullEventData: Record<string, any>
): Promise<
  { success: true; event_id: string } | { success: false; error: string }
> {
  try {
    const db = getServerSupabase();

    const { error: eventUpdateError } = await db
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
        status: eventData.status,
        published_at: eventData.published_at,
        ticket_design_config: eventData.ticket_design_config,
        updated_at: eventData.updated_at,
      })
      .eq("id", eventId)
      .eq("user_id", userId)
      .select()
      .single();

    if (eventUpdateError) {
      return { success: false, error: eventUpdateError.message };
    }

    if (fullEventData.ticket_types && fullEventData.ticket_types.length > 0) {
      await db.from("ticket_types").delete().eq("event_id", eventId);

      const ticketTypesToInsert = fullEventData.ticket_types.map(
        (ticket: any) => ({
          event_id: eventId,
          name: ticket.name,
          price: ticket.price,
          quantity: ticket.quantity,
          description: ticket.description,
          benefits: ticket.benefits,
        })
      );

      const { error: ticketInsertError } = await db
        .from("ticket_types")
        .insert(ticketTypesToInsert);

      if (ticketInsertError) {
        return { success: false, error: ticketInsertError.message };
      }
    }

    if (
      fullEventData.venue_sections &&
      fullEventData.venue_sections.length > 0
    ) {
      await db.from("venue_sections").delete().eq("event_id", eventId);

      const venueSectionsToInsert = fullEventData.venue_sections.map(
        (section: any) => ({
          event_id: eventId,
          name: section.name,
          capacity: section.capacity,
          price: section.price,
          description: section.description,
          seating_chart_data: section.seating_chart_data,
        })
      );

      const { error: venueInsertError } = await db
        .from("venue_sections")
        .insert(venueSectionsToInsert);

      if (venueInsertError) {
        return { success: false, error: venueInsertError.message };
      }
    }

    if (fullEventData.seating_options) {
      await db.from("seating_options").delete().eq("event_id", eventId);

      const { error: seatingInsertError } = await db
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
  } catch (error: any) {
    return { success: false, error: error?.message || "Update failed" };
  }
}

export async function getEventImageId(
  eventId: string,
  userId: string
): Promise<string | null> {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("events")
    .select("image_id")
    .eq("id", eventId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.image_id ?? null;
}

export async function loadUserEvents(userId: string): Promise<any[]> {
  try {
    const db = getServerSupabase();
    const { data: events, error } = await db
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

    if (error || !events) return [];

    return await Promise.all(
      events.map(async (event) => {
        let eventWithImage: any = event;

        if (event.image_id) {
          const { data: imageData, error: imageError } = await db
            .from("images")
            .select("*")
            .eq("id", event.image_id)
            .single();

          if (!imageError && imageData) {
            eventWithImage = { ...event, image: imageData };
          }
        }

        try {
          const { data: stats, error: statsError } = await db.rpc(
            "get_event_statistics",
            { p_event_id: event.id }
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
          } else {
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
        } catch {
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
  } catch {
    return [];
  }
}

export async function loadUserEventsForSelector(
  userId: string
): Promise<{ data: any[]; error: any }> {
  try {
    const db = getServerSupabase();
    const { data: events, error } = await db
      .from("events")
      .select("id, name, date, image_id, ticket_design_config")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) return { data: [], error };

    const eventsWithImages = await Promise.all(
      (events || []).map(async (event) => {
        const eventWithImage: any = { ...event };

        if (event.image_id) {
          const { data: imageData, error: imageError } = await db
            .from("images")
            .select("file_path")
            .eq("id", event.image_id)
            .single();

          if (!imageError && imageData) {
            if (imageData.file_path.startsWith("http")) {
              eventWithImage.image = imageData.file_path;
            } else {
              const { data: urlData } = db.storage
                .from("event_images")
                .getPublicUrl(imageData.file_path);
              eventWithImage.image = urlData.publicUrl;
            }
          }
        }

        return eventWithImage;
      })
    );

    return { data: eventsWithImages, error: null };
  } catch (error: any) {
    return { data: [], error: error?.message || "Failed to load events" };
  }
}

export async function loadGuestsRows(
  userId: string
): Promise<{ data: any[]; error: any }> {
  try {
    const db = getServerSupabase();
    const { data: guests, error: guestsError } = await db.rpc(
      "get_guests_for_user",
      { user_id_param: userId }
    );

    if (guestsError) return { data: [], error: guestsError };
    if (!guests || guests.length === 0) return { data: [], error: null };

    const transformedGuests = guests.map((guest: any) => ({
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
    }));

    return { data: transformedGuests, error: null };
  } catch (error: any) {
    return { data: [], error: error?.message || "Failed to load guests" };
  }
}

export async function getRecentActivities(userId: string): Promise<any[]> {
  try {
    const db = getServerSupabase();
    const activities: any[] = [];

    const { data: recentOrders, error: ordersError } = await db
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
      recentOrders.forEach((order: any) => {
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

    const { data: recentCheckIns, error: checkInsError } = await db
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
      recentCheckIns.forEach((guest: any) => {
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

    const { data: recentEvents, error: eventsError } = await db
      .from("events")
      .select("id, name, created_at, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(2);

    if (!eventsError && recentEvents) {
      recentEvents.forEach((event: any) => {
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

    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 6);
  } catch {
    return [];
  }
}

export async function loadOwnedEventForEdit(
  eventId: string,
  userId: string
): Promise<any | null> {
  const db = getServerSupabase();
  const { data: event, error } = await db
    .from("events")
    .select(
      `
      *,
      ticket_types(*),
      venue_sections(*),
      seating_options(*)
    `
    )
    .eq("id", eventId)
    .eq("user_id", userId)
    .single();

  if (error || !event) return null;

  let eventWithImage: any = event;
  if (event.image_id) {
    const { data: imageData, error: imageError } = await db
      .from("images")
      .select("*")
      .eq("id", event.image_id)
      .single();

    if (!imageError && imageData) {
      eventWithImage = { ...event, image: imageData };
    }
  }

  return eventWithImage;
}

export async function deleteOwnedEvent(
  eventId: string,
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const db = getServerSupabase();

    const { data: eventData, error: eventError } = await db
      .from("events")
      .select("image_id")
      .eq("id", eventId)
      .eq("user_id", userId)
      .single();

    if (eventError || !eventData) {
      return { success: false, error: "Event not found" };
    }

    const { error: deleteError } = await db
      .from("events")
      .delete()
      .eq("id", eventId)
      .eq("user_id", userId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    if (eventData.image_id) {
      const { data: imageData } = await db
        .from("images")
        .select("file_name")
        .eq("id", eventData.image_id)
        .single();

      if (imageData?.file_name) {
        await db.storage.from("event_images").remove([imageData.file_name]);
        await db.from("images").delete().eq("id", eventData.image_id);
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Delete failed" };
  }
}

export async function addGuestToOwnedEvent(
  eventId: string,
  userId: string,
  guestData: Record<string, any>
): Promise<
  { success: true; data: any } | { success: false; error: string }
> {
  try {
    const db = getServerSupabase();

    const { data: owned, error: ownedError } = await db
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("user_id", userId)
      .single();

    if (ownedError || !owned) {
      return { success: false, error: "Event not found or unauthorized" };
    }

    const { data: ticketNumberData, error: ticketNumberError } = await db.rpc(
      "generate_ticket_number"
    );

    if (ticketNumberError) {
      return { success: false, error: "Failed to generate ticket number" };
    }

    const { data, error } = await db
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
          ticket_number: ticketNumberData,
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
  } catch (error: any) {
    return { success: false, error: error?.message || "Add guest failed" };
  }
}

export async function loadOrganizerScannerEvents(
  userId: string
): Promise<any[]> {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("events")
    .select("id, name, date, location, status")
    .eq("user_id", userId)
    .in("status", ["published", "live"])
    .order("date", { ascending: true });

  if (error) return [];
  return data || [];
}

export async function loadEventTicketTypes(
  eventId: string,
  userId: string
): Promise<{ success: true; data: any[] } | { success: false; error: string }> {
  const db = getServerSupabase();
  const { data: owned } = await db
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", userId)
    .single();

  if (!owned) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: ticketTypes, error } = await db
    .from("ticket_types")
    .select("id, name, description, price, quantity, sold_quantity, is_active")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: ticketTypes || [] };
}

export async function assertEventOwnedByUser(
  eventId: string,
  userId: string
): Promise<boolean> {
  const db = getServerSupabase();
  const { data } = await db
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function getEventOrdersRevenue(
  eventId: string,
  userId: string
): Promise<any[]> {
  const db = getServerSupabase();
  const owned = await assertEventOwnedByUser(eventId, userId);
  if (!owned) return [];

  const { data, error } = await db
    .from("orders")
    .select("id, total_amount, payment_status, order_status, created_at")
    .eq("event_id", eventId);

  if (error) return [];
  return data || [];
}
