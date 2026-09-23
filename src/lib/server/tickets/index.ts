/**
 * Rebuild server domain: tickets (roadmap 3.2).
 * Kit-privileged orders/order_items/guests writes via getServerSupabase.
 * Do not import from client components.
 */
import { getServerSupabase } from "$lib/server/db";
import { env } from "$env/dynamic/public";

const ANONYMOUS_KEY = env.PUBLIC_SUPABASE_ANON_KEY || "anonymous";

async function resolveBuyer(userData: Record<string, any>) {
  const db = getServerSupabase();
  if (userData?.wallet_address) {
    const { data: web3User } = await db
      .from("web3_users")
      .select("id, wallet_address, username, display_name")
      .eq("wallet_address", userData.wallet_address)
      .maybeSingle();
    if (web3User) return { success: true as const, user: web3User };
  }
  if (userData?.id) {
    const { data: user } = await db
      .from("web3_users")
      .select("id, wallet_address, username, display_name")
      .eq("id", userData.id)
      .maybeSingle();
    if (user) return { success: true as const, user };
  }
  return {
    success: false as const,
    fallbackData: userData,
  };
}

export async function claimTickets(
  eventId: string,
  selectedTickets: Record<string, number>,
  userData: Record<string, any>,
  paymentInfo: Record<string, any> | null = null
): Promise<
  | {
      success: true;
      orderId: string;
      orderNumber: string;
      ticketsClaimed: number;
      message: string;
    }
  | { success: false; error: string }
> {
  try {
    const db = getServerSupabase();
    const orderNumber = `${
      paymentInfo ? "PAID" : "FREE"
    }-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let totalAmount = 0;
    const ticketTypeDetails: any[] = [];

    for (const [selectedTicketTypeId, quantity] of Object.entries(
      selectedTickets
    )) {
      if (quantity > 0) {
        const ticketTypeIdToUse = String(selectedTicketTypeId);
        const { data: ticketType, error: ticketError } = await db
          .from("ticket_types")
          .select("*")
          .eq("id", ticketTypeIdToUse)
          .single();

        if (ticketError || !ticketType) {
          return {
            success: false,
            error: "Failed to get ticket type details",
          };
        }

        const ticketPrice =
          typeof ticketType.price === "string"
            ? parseFloat(ticketType.price)
            : ticketType.price;

        totalAmount += ticketPrice * quantity;
        ticketTypeDetails.push({
          id: ticketType.id,
          name: ticketType.name,
          price: ticketPrice,
          quantity,
        });
      }
    }

    const orderData: Record<string, any> = {
      event_id: eventId,
      buyer_id: userData.id || null,
      buyer_wallet_address: userData.wallet_address || null,
      buyer_email: userData.email || null,
      buyer_name: userData.name || userData.display_name || "Anonymous",
      order_number: orderNumber,
      total_amount: totalAmount,
      currency: paymentInfo ? paymentInfo.currency || "USDC" : "NLe",
      payment_method: paymentInfo ? paymentInfo.paymentMethod : "free",
      payment_status: "completed",
      transaction_hash: paymentInfo ? paymentInfo.transactionSignature : null,
      order_status: "confirmed",
    };

    const authResult = await resolveBuyer(userData);
    if (authResult.success) {
      orderData.buyer_id = authResult.user.id;
      orderData.buyer_wallet_address = authResult.user.wallet_address;
      orderData.buyer_name =
        authResult.user.display_name || authResult.user.username;
    } else {
      const fallbackData = authResult.fallbackData || userData;
      orderData.buyer_wallet_address = fallbackData.wallet_address;
      orderData.buyer_name =
        fallbackData.name || fallbackData.display_name || "Anonymous";
    }

    if (paymentInfo?.buyerWallet) {
      orderData.buyer_wallet_address = paymentInfo.buyerWallet;
    }

    let orderId: string | null = null;
    let totalTicketsClaimed = 0;

    if (paymentInfo) {
      const { data: paidResult, error: paidError } = await db.rpc(
        "create_paid_ticket_order_with_items",
        {
          p_event_id: eventId,
          p_buyer_wallet_address:
            orderData.buyer_wallet_address || ANONYMOUS_KEY,
          p_buyer_name: orderData.buyer_name,
          p_order_number: orderNumber,
          p_ticket_details: ticketTypeDetails,
          p_total_amount: totalAmount,
          p_currency: paymentInfo.currency || "USDC",
          p_transaction_hash: paymentInfo.transactionSignature,
          p_payment_method: paymentInfo.paymentMethod || "solana",
        }
      );

      if (
        paidError ||
        !paidResult ||
        paidResult.length === 0 ||
        !paidResult[0].success
      ) {
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
        return { success: false, error: errorMessage };
      }
      orderId = paidResult[0].order_id;
      totalTicketsClaimed = paidResult[0].tickets_claimed;
    } else {
      const { data: freeResult, error: freeError } = await db.rpc(
        "create_free_ticket_order_with_items",
        {
          p_event_id: eventId,
          p_buyer_wallet_address:
            orderData.buyer_wallet_address || ANONYMOUS_KEY,
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
        const errorMessage =
          freeResult?.[0]?.error_message ||
          freeError?.message ||
          "Failed to create free ticket order";
        if (errorMessage.includes("Not enough tickets available")) {
          return {
            success: false,
            error:
              "Sorry, some tickets are no longer available. Please refresh the page and try again.",
          };
        }
        return { success: false, error: errorMessage };
      }
      orderId = freeResult[0].order_id;
      totalTicketsClaimed = freeResult[0].tickets_claimed;

      // Mirror paid attachBuyerId: write session id, not resolveBuyer web3 id
      const sessionBuyerId = userData?.id ? String(userData.id) : "";
      if (orderId && sessionBuyerId) {
        await db
          .from("orders")
          .update({
            buyer_id: sessionBuyerId,
            ...(orderData.buyer_email
              ? { buyer_email: orderData.buyer_email }
              : {}),
          })
          .eq("id", orderId);
      }
    }

    if (orderId && totalTicketsClaimed > 0) {
      return {
        success: true,
        orderId,
        orderNumber,
        ticketsClaimed: totalTicketsClaimed,
        message: `Successfully claimed ${totalTicketsClaimed} ticket(s)`,
      };
    }

    return { success: false, error: "Failed to create order" };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to claim tickets",
    };
  }
}

export async function findOrderByTransactionHash(
  transactionId: string,
  eventId: string,
  paymentMethod: string
): Promise<{ id: string; order_number: string } | null> {
  const db = getServerSupabase();
  const { data } = await db
    .from("orders")
    .select("id, order_number")
    .eq("transaction_hash", transactionId)
    .eq("event_id", eventId)
    .eq("payment_method", paymentMethod)
    .maybeSingle();
  return data ?? null;
}

export async function loadOrderItemsForOrder(orderId: string) {
  const db = getServerSupabase();
  return db.from("order_items").select("*").eq("order_id", orderId);
}

export async function updateOrderItem(
  itemId: string,
  updates: Record<string, any>
) {
  const db = getServerSupabase();
  return db.from("order_items").update(updates).eq("id", itemId).select();
}

export async function insertGuests(rows: Record<string, any>[]) {
  const db = getServerSupabase();
  return db.from("guests").insert(rows).select();
}

export async function getTicketType(ticketTypeId: string) {
  const db = getServerSupabase();
  return db.from("ticket_types").select("*").eq("id", ticketTypeId).single();
}

export async function getGuestForScanner(guestId: string) {
  const db = getServerSupabase();
  return db
    .from("guests")
    .select(
      "id, event_id, status, check_in_time, first_name, last_name, ticket_type_id"
    )
    .eq("id", guestId)
    .maybeSingle();
}

export async function getTicketTypeName(ticketTypeId: string) {
  const db = getServerSupabase();
  return db
    .from("ticket_types")
    .select("name")
    .eq("id", ticketTypeId)
    .maybeSingle();
}

export async function getOrdersForEvent(eventId: string) {
  const db = getServerSupabase();
  return db.from("orders").select("id").eq("event_id", eventId);
}

export async function getOrderItemsByIds(orderIds: string[]) {
  const db = getServerSupabase();
  return db
    .from("order_items")
    .select("id, order_id, check_in_time, current_owner, ticket_type_id")
    .in("order_id", orderIds);
}

export async function updateOrderItemCheckIn(
  itemId: string,
  updates: Record<string, any>
) {
  const db = getServerSupabase();
  return db.from("order_items").update(updates).eq("id", itemId).select();
}

export async function getOrderBuyer(orderId: string) {
  const db = getServerSupabase();
  return db
    .from("orders")
    .select("buyer_name")
    .eq("id", orderId)
    .maybeSingle();
}

export type MyTicketStatus =
  | "VALID"
  | "CHECKED IN"
  | "ATTENDED"
  | "EXPIRED";

export type MyTicketRow = {
  id: string;
  orderId: string;
  status: MyTicketStatus;
  bucket: "upcoming" | "past";
  eventId: string;
  eventName: string;
  eventDate: string | null;
  eventTime: string;
  eventLocation: string;
  eventImage: string | null;
  ticketDesignConfig: Record<string, any> | null;
  ticketTypeName: string;
  price: number;
  priceLabel: string;
  isFree: boolean;
  /** FR-19 QR payload for scanner wiring in roadmap 7.1 (depends on 6.1). Never wallet. */
  qrPayload: string;
  guestId: string | null;
  guestName: string;
  ticketNumber: string | null;
  checkInTime: string | null;
  dateLabel: string;
  timeLabel: string;
  metaLine: string;
  rowMetaLine: string;
  countdownLabel: string | null;
  eventStartMs: number;
};

export type MyTicketsPayload = {
  userName: string;
  upcoming: MyTicketRow[];
  past: MyTicketRow[];
  highlight: MyTicketRow | null;
  pastHighlight: MyTicketRow | null;
  stats: { upcoming: number; past: number; transfer: number };
};

function resolveImageUrl(
  db: ReturnType<typeof getServerSupabase>,
  filePath: string | null | undefined
): string | null {
  if (!filePath) return null;
  if (filePath.startsWith("http")) return filePath;
  const { data: urlData } = db.storage
    .from("event_images")
    .getPublicUrl(filePath);
  return urlData?.publicUrl || null;
}

function parseEventStartMs(
  dateRaw: string | null | undefined,
  timeRaw: string | null | undefined
): number {
  if (!dateRaw) return Number.POSITIVE_INFINITY;
  const d = new Date(dateRaw);
  if (Number.isNaN(d.getTime())) return Number.POSITIVE_INFINITY;
  if (timeRaw) {
    const parts = String(timeRaw).split(":");
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (Number.isFinite(h)) {
      d.setHours(h, Number.isFinite(m) ? m : 0, 0, 0);
    }
  }
  return d.getTime();
}

function isEventEnded(eventStartMs: number): boolean {
  if (!Number.isFinite(eventStartMs)) return false;
  return eventStartMs < Date.now();
}

function formatCountdown(eventStartMs: number): string | null {
  const ms = eventStartMs - Date.now();
  if (!Number.isFinite(eventStartMs) || ms <= 0) return null;
  const days = Math.ceil(ms / 86_400_000);
  if (days <= 0) {
    const hours = Math.max(1, Math.ceil(ms / 3_600_000));
    return hours === 1 ? "IN 1 HOUR" : `IN ${hours} HOURS`;
  }
  if (days === 1) return "IN 1 DAY";
  return `IN ${days} DAYS`;
}

function formatDateLong(dateRaw: string | null | undefined): string {
  if (!dateRaw) return "";
  const d = new Date(dateRaw);
  if (Number.isNaN(d.getTime())) return String(dateRaw);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(dateRaw: string | null | undefined): string {
  if (!dateRaw) return "";
  const d = new Date(dateRaw);
  if (Number.isNaN(d.getTime())) return String(dateRaw);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeLabel(timeRaw: string | null | undefined): string {
  if (!timeRaw) return "";
  const raw = String(timeRaw).trim();
  if (/^\d{1,2}:\d{2}/.test(raw)) return raw.slice(0, 5);
  return raw;
}

function formatPriceLabel(typeName: string, price: number, isFree: boolean): string {
  if (isFree || price <= 0) return `${typeName} · Free`;
  const n = Number.isInteger(price) ? String(price) : price.toFixed(2);
  return `${typeName} · NLe ${n}`;
}

/**
 * Cookie-authz My Tickets load (roadmap 6.1 / FR-19–20).
 * Filters by buyer_id = session user id via Kit privileged client.
 * Not live auth.uid() RLS — Data Model §7 / API Spec client+RLS waits on Auth JWT cutover.
 */
export async function loadMyTicketsForBuyer(
  userId: string,
  userName = "Attendee"
): Promise<MyTicketsPayload> {
  const empty: MyTicketsPayload = {
    userName: userName || "Attendee",
    upcoming: [],
    past: [],
    highlight: null,
    pastHighlight: null,
    stats: { upcoming: 0, past: 0, transfer: 0 },
  };

  if (!userId) return empty;

  const db = getServerSupabase();
  const { data: orders, error } = await db
    .from("orders")
    .select(
      `
      id,
      event_id,
      payment_status,
      payment_method,
      total_amount,
      order_status,
      events (
        id,
        name,
        date,
        time,
        location,
        image_id,
        ticket_design_config
      ),
      order_items (
        id,
        check_in_time,
        guest_id,
        quantity,
        unit_price,
        ticket_types ( name, price ),
        guests ( id, ticket_number, first_name, last_name )
      )
    `
    )
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });

  if (error || !orders?.length) return empty;

  const imageCache = new Map<string, string | null>();

  async function eventImageUrl(imageId: string | null | undefined) {
    if (!imageId) return null;
    if (imageCache.has(imageId)) return imageCache.get(imageId) ?? null;
    const { data: imageData } = await db
      .from("images")
      .select("file_path")
      .eq("id", imageId)
      .maybeSingle();
    const url = resolveImageUrl(db, imageData?.file_path);
    imageCache.set(imageId, url);
    return url;
  }

  const rows: MyTicketRow[] = [];

  for (const order of orders as any[]) {
    const paymentStatus = String(order.payment_status || "").toLowerCase();
    const paymentMethod = String(order.payment_method || "").toLowerCase();
    const isFreeOrder = paymentMethod === "free" || Number(order.total_amount) === 0;
    const isPaidOk =
      paymentStatus === "completed" ||
      paymentStatus === "paid" ||
      paymentStatus === "confirmed";
    // Fulfilled only: paid+free Must (5.4 / 5.6). Skip pending/failed.
    if (!isFreeOrder && !isPaidOk) continue;
    if (isFreeOrder && paymentStatus && !["completed", "paid", "confirmed", ""].includes(paymentStatus)) {
      continue;
    }

    const eventRaw = order.events;
    const event = Array.isArray(eventRaw) ? eventRaw[0] : eventRaw;
    if (!event) continue;

    const eventImage = await eventImageUrl(event.image_id);
    const eventStartMs = parseEventStartMs(event.date, event.time);
    const ended = isEventEnded(eventStartMs);
    const dateLabel = formatDateLong(event.date);
    const dateShort = formatDateShort(event.date);
    const timeLabel = formatTimeLabel(event.time);
    const location = event.location || "";

    const items = Array.isArray(order.order_items) ? order.order_items : [];
    for (const item of items) {
      const ticketTypeRaw = item.ticket_types;
      const ticketType = Array.isArray(ticketTypeRaw)
        ? ticketTypeRaw[0]
        : ticketTypeRaw;
      const guestRaw = item.guests;
      const guest = Array.isArray(guestRaw) ? guestRaw[0] : guestRaw;
      const typeName = ticketType?.name || "Ticket";
      const unitPrice = Number(
        item.unit_price ?? ticketType?.price ?? (isFreeOrder ? 0 : 0)
      );
      const isFree = isFreeOrder || unitPrice <= 0;
      const checkInTime = item.check_in_time || null;

      let status: MyTicketStatus;
      let bucket: "upcoming" | "past";
      if (ended && checkInTime) {
        status = "ATTENDED";
        bucket = "past";
      } else if (ended) {
        status = "EXPIRED";
        bucket = "past";
      } else if (checkInTime) {
        status = "CHECKED IN";
        bucket = "upcoming";
      } else {
        status = "VALID";
        bucket = "upcoming";
      }

      // FR-19: prefer guest ticket_number / guest id; else order_items.id. Consumed by Kit scanner in 7.1.
      const ticketNumber = guest?.ticket_number || null;
      const guestId = guest?.id || item.guest_id || null;
      const qrPayload = ticketNumber || guestId || item.id;
      const guestName = guest
        ? [guest.first_name, guest.last_name].filter(Boolean).join(" ").trim()
        : "";

      const metaParts = [typeName, location, dateLabel, timeLabel].filter(Boolean);
      const rowMeta = [dateShort, timeLabel].filter(Boolean).join(" · ");
      const rowMetaLine = location
        ? `${rowMeta}${rowMeta ? " | " : ""}${location}`
        : rowMeta;

      rows.push({
        id: item.id,
        orderId: order.id,
        status,
        bucket,
        eventId: event.id,
        eventName: event.name || "Event",
        eventDate: event.date || null,
        eventTime: timeLabel,
        eventLocation: location,
        eventImage,
        ticketDesignConfig: event.ticket_design_config || null,
        ticketTypeName: typeName,
        price: unitPrice,
        priceLabel: formatPriceLabel(typeName, unitPrice, isFree),
        isFree,
        qrPayload: String(qrPayload),
        guestId,
        guestName: guestName || userName || "Guest",
        ticketNumber,
        checkInTime,
        dateLabel,
        timeLabel,
        metaLine: metaParts.join(" · "),
        rowMetaLine,
        countdownLabel: formatCountdown(eventStartMs),
        eventStartMs,
      });
    }
  }

  const upcoming = rows
    .filter((r) => r.bucket === "upcoming")
    .sort((a, b) => a.eventStartMs - b.eventStartMs);
  const past = rows
    .filter((r) => r.bucket === "past")
    .sort((a, b) => b.eventStartMs - a.eventStartMs);

  const soonestValid = upcoming.find((r) => r.status === "VALID") || null;
  const soonestCheckedIn =
    upcoming.find((r) => r.status === "CHECKED IN") || null;
  const highlight = soonestValid || soonestCheckedIn;
  // Past highlight: prefer newest ATTENDED, else newest past row.
  const pastHighlight =
    past.find((r) => r.status === "ATTENDED") || past[0] || null;

  return {
    userName: userName || "Attendee",
    upcoming,
    past,
    highlight,
    pastHighlight,
    stats: {
      upcoming: upcoming.length,
      past: past.length,
      transfer: 0,
    },
  };
}

export async function loadUserOrdersServer(
  userId: string | null,
  walletAddress: string | null = null
) {
  const db = getServerSupabase();
  let walletAddressToUse = walletAddress;
  if (!walletAddressToUse && userId) {
    walletAddressToUse = "anonymous";
  }

  if (walletAddressToUse) {
    const { data: walletOrders, error: walletError } = await db.rpc(
      "load_orders_by_wallet",
      { p_wallet_address: walletAddressToUse }
    );

    if (!walletError && walletOrders && walletOrders.length > 0) {
      return walletOrders.map((order: any) => ({
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
      }));
    }
  }

  let query = db
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

  if (userId) query = query.eq("buyer_id", userId);
  else if (walletAddress) query = query.eq("buyer_wallet_address", walletAddress);

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

export async function loadScanHistoryServer(eventId: string, limit = 50) {
  const db = getServerSupabase();
  const scanHistory: any[] = [];

  const { data: guestsCheckIns } = await db
    .from("guests")
    .select(
      `
      id,
      first_name,
      last_name,
      check_in_time,
      check_in_location,
      ticket_types(name)
    `
    )
    .eq("event_id", eventId)
    .not("check_in_time", "is", null)
    .order("check_in_time", { ascending: false })
    .limit(limit);

  if (guestsCheckIns) {
    guestsCheckIns.forEach((guest: any) => {
      const checkInDate = new Date(guest.check_in_time);
      scanHistory.push({
        id: guest.id,
        guestName: `${guest.first_name} ${guest.last_name}`,
        status: "success",
        message: `${guest.ticket_types?.name || "Ticket"} - Checked In`,
        timestamp: checkInDate.toLocaleString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        check_in_time: guest.check_in_time,
        walletAddress: undefined,
      });
    });
  }

  const { data: eventOrders } = await db
    .from("orders")
    .select("id")
    .eq("event_id", eventId);

  if (eventOrders && eventOrders.length > 0) {
    const orderIds = eventOrders.map((o) => o.id);
    const { data: orderItemsCheckIns } = await db
      .from("order_items")
      .select(
        `
        id,
        check_in_time,
        check_in_location,
        current_owner,
        ticket_types(name),
        orders(buyer_name)
      `
      )
      .in("order_id", orderIds)
      .not("check_in_time", "is", null)
      .order("check_in_time", { ascending: false })
      .limit(limit);

    if (orderItemsCheckIns) {
      orderItemsCheckIns.forEach((item: any) => {
        const checkInDate = new Date(item.check_in_time);
        scanHistory.push({
          id: item.id,
          guestName: item.orders?.buyer_name || "Unknown",
          status: "success",
          message: `${item.ticket_types?.name || "Ticket"} - Checked In`,
          timestamp: checkInDate.toLocaleString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          check_in_time: item.check_in_time,
          walletAddress: item.current_owner,
        });
      });
    }
  }

  return scanHistory
    .sort(
      (a, b) =>
        new Date(b.check_in_time).getTime() -
        new Date(a.check_in_time).getTime()
    )
    .slice(0, limit);
}
