// @ts-nocheck
import { generateUniqueFilename } from "$lib/store";
import { supabase } from "$lib/supabase/client.js";

export async function updateEventWithDetails(
  eventId,
  eventData,
  userId,
  fullEventData,
  db = supabase
) {
  try {
    const { data: eventUpdateData, error: eventUpdateError } = await db
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
      const { error: deleteTicketError } = await db
        .from("ticket_types")
        .delete()
        .eq("event_id", eventId);

      if (deleteTicketError) {
      }

      const ticketTypesToInsert = fullEventData.ticket_types.map((ticket) => ({
        event_id: eventId,
        name: ticket.name,
        price: ticket.price,
        quantity: ticket.quantity,
        description: ticket.description,
        benefits: ticket.benefits,
      }));

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
      const { error: deleteVenueError } = await db
        .from("venue_sections")
        .delete()
        .eq("event_id", eventId);

      if (deleteVenueError) {
      }

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

      const { error: venueInsertError } = await db
        .from("venue_sections")
        .insert(venueSectionsToInsert);

      if (venueInsertError) {
        return { success: false, error: venueInsertError.message };
      }
    }

    if (fullEventData.seating_options) {
      const { error: deleteSeatingError } = await db
        .from("seating_options")
        .delete()
        .eq("event_id", eventId);

      if (deleteSeatingError) {
      }

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
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createEventWithDetails(eventData, userId, db = supabase) {
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
      ticket_design_config,
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
      p_ticket_design_config: ticket_design_config,
      p_ticket_types: ticket_types,
      p_venue_sections: venue_sections,
      p_seating_options: seating_options,
    };

    const { data, error } = await db.rpc(
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

export async function uploadEventImageNew(imageFile, userId, db = supabase) {
  try {
    const fileName = `events/${userId}/${generateUniqueFilename()}_${
      imageFile.name
    }`;

    const { data: uploadData, error: uploadError } = await db.storage
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
