/**
 * Rebuild server domain: events (roadmap 3.2).
 * Kit-privileged event I/O via getServerSupabase after cookie authz.
 * Do not import from client components.
 */
import { getServerSupabase } from "$lib/server/db";
import { generateUniqueFilename } from "$lib/store";
import { formatNle, providerLabel } from "$lib/client/walletFormat";
import { isPrivateEvent } from "$lib/eventVisibility";
import { PRIVATE_INVITE_TYPE_NAME } from "$lib/server/payments/privateIssue";
import { ticketCapacity, type TicketTypeInput } from "./validate";

export {
  ticketCapacity,
  validateEventInput,
  normalizeCategory,
  normalizeTags,
  normalizeUrl,
  normalizeSocialMedia,
  normalizeEmail,
} from "./validate";
export { isEventOnSale } from "./onSale";
export {
  getMaxPerOrder,
  updateEventSettings,
  DEFAULT_MAX_PER_ORDER,
  type EventSettingsInput,
} from "./settings";

function orderActivityDetails(order: any): string {
  const ref = `Order #${order.order_number}`;
  if (order.payment_method === "free") return `${ref} - Free ticket`;
  const via = order.payment_method === "solana" ? "Solana" : providerLabel(order.payment_method);
  return `${ref} - ${formatNle(parseFloat(order.total_amount))} via ${via}`;
}

function privateIssueActivityDetails(row: any): string {
  const qty = Number(row.metadata?.qty) || 0;
  const tickets = `${qty} ticket${qty === 1 ? "" : "s"}`;
  const amount = formatNle(Math.abs(parseFloat(row.amount) || 0));
  if (row.type === "private_issue_payment") {
    return `${tickets} - ${amount} via ${providerLabel(row.metadata?.payment_method)}`;
  }
  return `${tickets} - ${amount} from balance`;
}

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

export const MAX_EVENT_IMAGE_BYTES = 5 * 1024 * 1024;

export type EventImage = { bytes: Uint8Array; mime: string; ext: string };

function sniffImageType(bytes: Uint8Array): { mime: string; ext: string } | null {
  const at = (i: number) => bytes[i];
  if (bytes.length >= 3 && at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((b, i) => at(i) === b)) {
    return { mime: "image/png", ext: "png" };
  }
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...Array.from(bytes.subarray(from, to)));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

/** Accepts a base64 data URL; only JPEG, PNG or WebP (checked by content) up to 5MB. */
export function decodeEventImageDataUrl(
  dataUrl: string
): { ok: true; image: EventImage } | { ok: false; error: string } {
  const match = /^data:([\w.+-]+\/[\w.+-]+)?;base64,/.exec(dataUrl);
  if (!match) return { ok: false, error: "Cover image must be a JPEG, PNG or WebP" };
  const base64 = dataUrl.slice(match[0].length);
  if (Math.floor((base64.length * 3) / 4) > MAX_EVENT_IMAGE_BYTES + 3) {
    return { ok: false, error: "Cover image must be 5MB or smaller" };
  }
  const bytes = new Uint8Array(Buffer.from(base64, "base64"));
  if (bytes.length === 0) {
    return { ok: false, error: "Cover image must be a JPEG, PNG or WebP" };
  }
  if (bytes.length > MAX_EVENT_IMAGE_BYTES) {
    return { ok: false, error: "Cover image must be 5MB or smaller" };
  }
  const type = sniffImageType(bytes);
  if (!type) return { ok: false, error: "Cover image must be a JPEG, PNG or WebP" };
  return { ok: true, image: { bytes, ...type } };
}

export async function uploadEventImage(
  image: EventImage,
  userId: string
): Promise<
  | { success: true; image_id: string; url: string }
  | { success: false; error: string }
> {
  try {
    const db = getServerSupabase();
    const fileName = `events/${userId}/${generateUniqueFilename()}.${image.ext}`;

    const { error: uploadError } = await db.storage
      .from("event_images")
      .upload(fileName, image.bytes, {
        cacheControl: "3600",
        contentType: image.mime,
        upsert: false,
        metadata: { owner: userId },
      });

    if (uploadError) {
      console.error("uploadEventImage storage error", uploadError);
      return { success: false, error: "Could not upload the cover image" };
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
          file_size: image.bytes.length,
          mime_type: image.mime,
          is_public: true,
        },
      ])
      .select();

    if (imageError) {
      console.error("uploadEventImage images insert error", imageError);
      return { success: false, error: "Could not upload the cover image" };
    }

    return {
      success: true,
      image_id: imageData[0].id,
      url: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error("uploadEventImage failed", error);
    return { success: false, error: "Could not upload the cover image" };
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

    if (error || data?.[0]?.success === false || !data?.[0]?.event_id) {
      console.error("createEventWithDetails failed", error || data);
      return { success: false, error: "Could not save the event" };
    }

    return {
      success: true,
      event_id: data[0].event_id,
      message: data[0].message,
    };
  } catch (error: any) {
    console.error("createEventWithDetails failed", error);
    return { success: false, error: "Could not save the event" };
  }
}

type TicketTypeFields = {
  name: string;
  price: number;
  quantity: number;
  description: string | null;
};

type TicketTypePlan = {
  updates: (TicketTypeFields & { id: string })[];
  inserts: TicketTypeFields[];
  deactivateIds: string[];
  deleteIds: string[];
};

function isPrivateInviteType(ticket: any): boolean {
  return String(ticket?.name || "").trim() === PRIVATE_INVITE_TYPE_NAME;
}

function ticketTypeFields(ticket: any): TicketTypeFields {
  return {
    name: ticket.name,
    price: ticket.price,
    quantity: ticket.quantity,
    description: ticket.description,
  };
}

/**
 * Ticket types are updated in place by id, never recreated: guests and
 * order_items reference them (ON DELETE SET NULL) and sold_quantity lives on
 * the row. Private Invite is owned by private issue and never touched here.
 */
async function planTicketTypeChanges(
  eventId: string,
  incomingRaw: any[],
  { allowEmpty = false }: { allowEmpty?: boolean } = {}
): Promise<
  | { ok: true; plan: TicketTypePlan }
  | { ok: false; error: string; validation: boolean }
> {
  const db = getServerSupabase();
  const { data: existingRows, error } = await db
    .from("ticket_types")
    .select("id, name, sold_quantity")
    .eq("event_id", eventId);
  if (error) {
    console.error("planTicketTypeChanges load failed", error);
    return { ok: false, error: "Could not save the event", validation: false };
  }

  const existing = (existingRows || []).filter((t) => !isPrivateInviteType(t));
  const existingById = new Map(existing.map((t) => [String(t.id), t]));
  const incoming = incomingRaw.filter((t) => t && !isPrivateInviteType(t));

  const plan: TicketTypePlan = {
    updates: [],
    inserts: [],
    deactivateIds: [],
    deleteIds: [],
  };
  if (incoming.length === 0 && !allowEmpty) return { ok: true, plan };
  const keptIds = new Set<string>();

  for (const ticket of incoming) {
    const match = ticket.id ? existingById.get(String(ticket.id)) : undefined;
    if (!match || keptIds.has(String(match.id))) {
      plan.inserts.push(ticketTypeFields(ticket));
      continue;
    }
    const sold = Number(match.sold_quantity) || 0;
    if ((Number(ticket.quantity) || 0) < sold) {
      return {
        ok: false,
        error: `${ticket.name || match.name}: quantity can't be lower than the ${sold} already sold`,
        validation: true,
      };
    }
    keptIds.add(String(match.id));
    plan.updates.push({ id: String(match.id), ...ticketTypeFields(ticket) });
  }

  const removed = existing.filter((t) => !keptIds.has(String(t.id)));
  if (removed.length === 0) return { ok: true, plan };

  const removedIds = removed.map((t) => String(t.id));
  const [guestRes, itemRes] = await Promise.all([
    db.from("guests").select("ticket_type_id").in("ticket_type_id", removedIds),
    db
      .from("order_items")
      .select("ticket_type_id")
      .in("ticket_type_id", removedIds),
  ]);

  if (guestRes.error || itemRes.error) {
    plan.deactivateIds = removedIds;
    return { ok: true, plan };
  }

  const soldIds = new Set(
    removed
      .filter((t) => (Number(t.sold_quantity) || 0) > 0)
      .map((t) => String(t.id))
  );
  for (const row of [...(guestRes.data || []), ...(itemRes.data || [])]) {
    if (row.ticket_type_id) soldIds.add(String(row.ticket_type_id));
  }

  for (const id of removedIds) {
    (soldIds.has(id) ? plan.deactivateIds : plan.deleteIds).push(id);
  }
  return { ok: true, plan };
}

async function applyTicketTypeChanges(
  eventId: string,
  plan: TicketTypePlan
): Promise<string | null> {
  const db = getServerSupabase();

  for (const { id, ...fields } of plan.updates) {
    const { error } = await db
      .from("ticket_types")
      .update(fields)
      .eq("id", id)
      .eq("event_id", eventId);
    if (error) return error.message;
  }

  if (plan.inserts.length > 0) {
    const { error } = await db
      .from("ticket_types")
      .insert(plan.inserts.map((t) => ({ event_id: eventId, ...t })));
    if (error) return error.message;
  }

  if (plan.deactivateIds.length > 0) {
    const { error } = await db
      .from("ticket_types")
      .update({ is_active: false })
      .eq("event_id", eventId)
      .in("id", plan.deactivateIds);
    if (error) return error.message;
  }

  if (plan.deleteIds.length > 0) {
    const { error } = await db
      .from("ticket_types")
      .delete()
      .eq("event_id", eventId)
      .in("id", plan.deleteIds);
    if (error) return error.message;
  }

  return null;
}

/** Stored state the update rules depend on; null when the event is not the user's. */
export async function loadEventUpdateState(
  eventId: string,
  userId: string
): Promise<{
  is_free_event: boolean;
  status: string;
  published_at: string | null;
  image_id: string | null;
  event_visibility: string;
  hasTicketSales: boolean;
  hasAnySales: boolean;
  hasPrivateTickets: boolean;
} | null> {
  const db = getServerSupabase();
  const { data: event, error } = await db
    .from("events")
    .select(
      "id, is_free_event, status, published_at, image_id, event_visibility, ticket_types(name, sold_quantity)"
    )
    .eq("id", eventId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("loadEventUpdateState failed", error);
    throw new Error("Could not load the event");
  }
  if (!event) return null;

  const types: any[] = (event as any).ticket_types || [];
  const hasTicketSales = types.some(
    (t) => !isPrivateInviteType(t) && (Number(t.sold_quantity) || 0) > 0
  );
  let hasAnySales = types.some((t) => (Number(t.sold_quantity) || 0) > 0);
  if (!hasAnySales) {
    const { count } = await db
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);
    hasAnySales = (count || 0) > 0;
  }

  const { count: privateCount, error: privateError } = await db
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("special_requirements", "private_issue");
  if (privateError) {
    console.error("loadEventUpdateState private tickets failed", privateError);
    throw new Error("Could not load the event");
  }

  return {
    is_free_event: !!event.is_free_event,
    status: String(event.status || "draft"),
    published_at: event.published_at || null,
    image_id: event.image_id || null,
    event_visibility: String(event.event_visibility || "public").toLowerCase(),
    hasTicketSales,
    hasAnySales,
    hasPrivateTickets: (privateCount || 0) > 0,
  };
}

/**
 * Writes only the keys in `payload` (already validated). Ticket types, when
 * given, are planned before and applied after the event row update, then
 * total_capacity is recomputed from the stored types. `clearSellableTypes`
 * (private events) removes every sellable type: unsold ones are deleted,
 * sold ones deactivated.
 */
export async function updateEventWithDetails(
  eventId: string,
  payload: Record<string, any>,
  userId: string,
  ticketTypes?: TicketTypeInput[],
  { clearSellableTypes = false }: { clearSellableTypes?: boolean } = {}
): Promise<
  | { success: true; event_id: string }
  | { success: false; error: string; validation: boolean }
> {
  const failed = (logLabel: string, detail: unknown) => {
    console.error(`updateEventWithDetails ${logLabel}`, detail);
    return {
      success: false as const,
      error: "Could not save the event",
      validation: false,
    };
  };

  try {
    const db = getServerSupabase();

    let ticketPlan: TicketTypePlan | null = null;
    if ((ticketTypes && ticketTypes.length > 0) || clearSellableTypes) {
      const planned = await planTicketTypeChanges(eventId, ticketTypes || [], {
        allowEmpty: clearSellableTypes,
      });
      if (!planned.ok) {
        return { success: false, error: planned.error, validation: planned.validation };
      }
      ticketPlan = planned.plan;
    }

    const { error: eventUpdateError } = await db
      .from("events")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .eq("user_id", userId)
      .select("id")
      .single();

    if (eventUpdateError) return failed("event update", eventUpdateError);

    if (ticketPlan) {
      const ticketError = await applyTicketTypeChanges(eventId, ticketPlan);
      if (ticketError) return failed("ticket types", ticketError);

      const { data: stored, error: storedError } = await db
        .from("ticket_types")
        .select("name, quantity, sold_quantity, is_active")
        .eq("event_id", eventId);
      if (storedError) return failed("capacity load", storedError);

      const { error: capacityError } = await db
        .from("events")
        .update({ total_capacity: ticketCapacity(stored) })
        .eq("id", eventId)
        .eq("user_id", userId);
      if (capacityError) return failed("capacity update", capacityError);
    }

    return { success: true, event_id: eventId };
  } catch (error: any) {
    return failed("threw", error);
  }
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
          details: orderActivityDetails(order),
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

    // Private issues create no order; filter by metadata.user_id because the
    // ledger key may be a linked wallet rather than user:<id>.
    const { data: privateIssues, error: privateError } = await db
      .from("wallet_transactions")
      .select("id, type, amount, created_at, metadata")
      .eq("source", "private_issue")
      .eq("status", "completed")
      .eq("metadata->>user_id", userId)
      .eq("metadata->>tickets_issued", "true")
      .order("created_at", { ascending: false })
      .limit(3);

    if (!privateError && privateIssues?.length) {
      const eventIds = [
        ...new Set(privateIssues.map((t: any) => t.metadata?.event_id).filter(Boolean)),
      ];
      const eventNames = new Map<string, string>();
      if (eventIds.length) {
        const { data: issueEvents } = await db
          .from("events")
          .select("id, name")
          .in("id", eventIds);
        for (const e of issueEvents || []) eventNames.set(e.id, e.name);
      }

      privateIssues.forEach((t: any) => {
        activities.push({
          type: "private_issue",
          icon: "ticket",
          message: `Private Tickets Issued: ${eventNames.get(t.metadata?.event_id) || "Event"}`,
          details: privateIssueActivityDetails(t),
          time: formatTimeAgo(t.created_at),
          timestamp: t.created_at,
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

export type PrivateEventCheck =
  | { ok: true }
  | { ok: false; error: string; status: number };

/** Owner check for private ticket issuing: the event must also be private. */
export async function assertPrivateEventOwnedByUser(
  eventId: string,
  userId: string
): Promise<PrivateEventCheck> {
  const { data } = await getServerSupabase()
    .from("events")
    .select("id, event_visibility")
    .eq("id", eventId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) {
    return { ok: false, error: "Event not found or unauthorized", status: 403 };
  }
  if (!isPrivateEvent(data)) {
    return {
      ok: false,
      error: "Private tickets can only be issued for private events",
      status: 400,
    };
  }
  return { ok: true };
}
