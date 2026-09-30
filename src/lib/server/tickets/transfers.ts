/**
 * Ticket Transfers (roadmap 6.2 / 6.2b, FR-21), HI-FI 604:1579 + 306:76, history 606:1343 + 311:174.
 * Transfer form checks (desktop 55:708, mobile 36:890): ticket eligibility + recipient username.
 * Cookie-authz Kit reads via loadMyTicketsForBuyer (order_items.owner_user_id = session Auth id).
 * The transfer itself is the transfer_order_item RPC (service role only), logged in ticket_transfers.
 */
import { getServerSupabase } from "$lib/server/db";
import { normalizeUsername } from "$lib/server/auth/username";
import {
  loadMyTicketsForBuyer,
  formatTierLabel,
  formatDateLong,
  formatTimeLabel,
  resolveImageUrl,
  type MyTicketRow,
} from "./index";

const DISPLAY_TIME_ZONE = "Africa/Freetown";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TransferTicketRow = MyTicketRow & {
  tierLabel: string;
};

export type TransferHistoryEntry = {
  id: string;
  eventName: string;
  eventImage: string | null;
  /** Ticket type as named by the organizer, e.g. "Standard Tier" or "General". */
  tierLabel: string;
  recipientUsername: string;
  /** e.g. "Feb 18, 2026" */
  transferredAtLabel: string;
  /** Event date tile parts, e.g. "FEB" / "18". */
  dateMonth: string;
  dateDay: string;
  status: "COMPLETED" | "PENDING";
};

export type TransfersPayload = {
  userName: string;
  tickets: TransferTicketRow[];
  next: TransferTicketRow | null;
  stats: { total: number; completed: number };
  /** All transfers, newest first. */
  history: TransferHistoryEntry[];
};

/** Event/ticket half of TransferReceiptCard, shared by the receipt and the failed state. */
export type TransferReceiptBase = {
  eventName: string;
  eventImage: string | null;
  tierBadge: string;
  ticketTypeName: string;
  venue: string;
  eventDateLabel: string;
  dateMonth: string;
  dateDay: string;
};

export type TransferReceipt = TransferReceiptBase & {
  recipientUsername: string;
  transferredAtLabel: string;
  reference: string;
};

export function emptyTransfersPayload(userName = "Attendee"): TransfersPayload {
  return {
    userName: userName || "Attendee",
    tickets: [],
    next: null,
    stats: { total: 0, completed: 0 },
    history: [],
  };
}

function dateTileParts(dateRaw: string | null | undefined) {
  if (!dateRaw) return { month: "", day: "" };
  const d = new Date(dateRaw);
  if (Number.isNaN(d.getTime())) return { month: "", day: "" };
  // events.date is a DATE ("YYYY-MM-DD"), parsed as UTC midnight
  return {
    month: d
      .toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
      .toUpperCase(),
    day: String(d.getUTCDate()),
  };
}

function formatTransferredAt(iso: string | null | undefined, withTime: boolean): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-US", {
    month: withTime ? "long" : "short",
    day: "numeric",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: DISPLAY_TIME_ZONE,
  });
  return `${date} · ${time}`;
}

export function toReceiptFields(src: {
  eventName?: string | null;
  eventImage?: string | null;
  ticketTypeName?: string | null;
  eventLocation?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
}): TransferReceiptBase {
  const typeName = src.ticketTypeName || "Ticket";
  const { month, day } = dateTileParts(src.eventDate);
  return {
    eventName: src.eventName || "Event",
    eventImage: src.eventImage ?? null,
    tierBadge: typeName.toUpperCase(),
    ticketTypeName: typeName,
    venue: src.eventLocation || "",
    eventDateLabel: [formatDateLong(src.eventDate), formatTimeLabel(src.eventTime)]
      .filter(Boolean)
      .join(" · "),
    dateMonth: month,
    dateDay: day,
  };
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function createImageResolver(db: ReturnType<typeof getServerSupabase>) {
  const cache = new Map<string, string | null>();
  return async (imageId: string | null | undefined) => {
    if (!imageId) return null;
    if (cache.has(imageId)) return cache.get(imageId) ?? null;
    const { data } = await db
      .from("images")
      .select("file_path")
      .eq("id", imageId)
      .maybeSingle();
    const url = resolveImageUrl(db, data?.file_path);
    cache.set(imageId, url);
    return url;
  };
}

const TRANSFER_SELECT = `
  id,
  reference,
  to_username,
  created_at,
  events ( id, name, date, time, location, image_id ),
  order_items ( id, unit_price, ticket_types ( name, price ) )
`;

/** VALID upcoming tickets the user holds. qrPayload is stripped: the form never shows the QR. */
export async function loadTransferTickets(
  userId: string,
  userName = "Attendee"
): Promise<{ userName: string; tickets: TransferTicketRow[] }> {
  if (!userId) return { userName: userName || "Attendee", tickets: [] };

  const base = await loadMyTicketsForBuyer(userId, userName);
  const tickets: TransferTicketRow[] = base.upcoming
    .filter((row) => row.status === "VALID")
    .map((row) => ({
      ...row,
      qrPayload: "",
      tierLabel: formatTierLabel(row.ticketTypeName, row.price, row.isFree),
    }));

  return { userName: base.userName, tickets };
}

/** Transfers sent by the user, newest first. */
export async function loadTransferHistory(userId: string): Promise<TransferHistoryEntry[]> {
  if (!userId) return [];
  const db = getServerSupabase();
  const { data, error } = await db
    .from("ticket_transfers")
    .select(TRANSFER_SELECT)
    .eq("from_user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  const imageFor = createImageResolver(db);
  const entries: TransferHistoryEntry[] = [];
  for (const row of data as any[]) {
    const event = one<any>(row.events);
    const item = one<any>(row.order_items);
    const ticketType = one<any>(item?.ticket_types);
    const typeName = ticketType?.name || "Ticket";
    const price = Number(item?.unit_price ?? ticketType?.price ?? 0);
    const { month, day } = dateTileParts(event?.date);
    entries.push({
      id: row.id,
      eventName: event?.name || "Event",
      eventImage: await imageFor(event?.image_id),
      tierLabel: formatTierLabel(typeName, price, price <= 0),
      recipientUsername: row.to_username,
      transferredAtLabel: formatTransferredAt(row.created_at, false),
      dateMonth: month,
      dateDay: day,
      status: "COMPLETED",
    });
  }
  return entries;
}

export async function loadTransfersPage(
  userId: string,
  userName = "Attendee"
): Promise<TransfersPayload> {
  if (!userId) return emptyTransfersPayload(userName);

  const [{ userName: name, tickets }, history] = await Promise.all([
    loadTransferTickets(userId, userName),
    loadTransferHistory(userId),
  ]);

  return {
    userName: name,
    tickets,
    next: tickets[0] ?? null,
    stats: { total: history.length, completed: history.length },
    history,
  };
}

/** Eligible ticket (VALID, upcoming, held by the session user) or null. */
export async function loadTransferTicket(
  userId: string,
  userName: string,
  ticketId: string
): Promise<TransferTicketRow | null> {
  if (!userId || !ticketId) return null;
  const { tickets } = await loadTransferTickets(userId, userName);
  return tickets.find((t) => t.id === ticketId) ?? null;
}

/** Receipt for a transfer the user sent, or null (other users get a 404). */
export async function loadTransferReceipt(
  userId: string,
  transferId: string
): Promise<TransferReceipt | null> {
  if (!userId || !transferId || !UUID_RE.test(transferId)) return null;

  const db = getServerSupabase();
  const { data: row, error } = await db
    .from("ticket_transfers")
    .select(TRANSFER_SELECT)
    .eq("id", transferId)
    .eq("from_user_id", userId)
    .maybeSingle();

  if (error || !row) return null;

  const r = row as any;
  const event = one<any>(r.events);
  const item = one<any>(r.order_items);
  const ticketType = one<any>(item?.ticket_types);
  const eventImage = await createImageResolver(db)(event?.image_id);

  return {
    ...toReceiptFields({
      eventName: event?.name,
      eventImage,
      ticketTypeName: ticketType?.name,
      eventLocation: event?.location,
      eventDate: event?.date,
      eventTime: event?.time,
    }),
    recipientUsername: r.to_username,
    transferredAtLabel: formatTransferredAt(r.created_at, true),
    reference: r.reference,
  };
}

export type RecipientCheck =
  | { ok: true; username: string }
  | {
      ok: false;
      code:
        | "invalid_username"
        | "recipient_not_found"
        | "recipient_inactive"
        | "recipient_unlinked"
        | "self_transfer";
      error: string;
    };

const RECIPIENT_MESSAGES = {
  recipient_not_found: "No SOS SEATS account with that username",
  recipient_inactive: "That account isn't active",
  recipient_unlinked: "That account can't receive tickets yet",
  self_transfer: "You can't transfer a ticket to yourself",
} as const;

/**
 * Recipient must be an active username account with a linked Auth user
 * (My Tickets loads by order_items.owner_user_id = Auth id) and not the sender.
 * Self is matched on ids only: locals.userName can fall back to a display name.
 */
export async function validateTransferRecipient(opts: {
  userId: string | null;
  web3UserId: string | null;
  raw: unknown;
}): Promise<RecipientCheck> {
  const input = typeof opts.raw === "string" ? opts.raw.trim().replace(/^@/, "") : "";
  const norm = normalizeUsername(input);
  if (!norm.ok) return { ok: false, code: "invalid_username", error: norm.error };

  const db = getServerSupabase();
  const { data, error } = await db
    .from("web3_users")
    .select("id, username, linked_auth_user_id, is_active")
    .eq("username", norm.username)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Could not check recipient");
  }
  if (!data) {
    return {
      ok: false,
      code: "recipient_not_found",
      error: RECIPIENT_MESSAGES.recipient_not_found,
    };
  }
  if (data.is_active === false) {
    return {
      ok: false,
      code: "recipient_inactive",
      error: RECIPIENT_MESSAGES.recipient_inactive,
    };
  }
  if (!data.linked_auth_user_id) {
    return {
      ok: false,
      code: "recipient_unlinked",
      error: RECIPIENT_MESSAGES.recipient_unlinked,
    };
  }
  if (
    (opts.userId && data.linked_auth_user_id === opts.userId) ||
    (opts.web3UserId && data.id === opts.web3UserId)
  ) {
    return {
      ok: false,
      code: "self_transfer",
      error: RECIPIENT_MESSAGES.self_transfer,
    };
  }

  return { ok: true, username: data.username as string };
}

const NOT_TRANSFERABLE = "This ticket can't be transferred";

const TRANSFER_ERRORS: Record<string, { status: 404 | 409; error: string }> = {
  not_owner: { status: 404, error: NOT_TRANSFERABLE },
  no_guest: { status: 404, error: NOT_TRANSFERABLE },
  order_not_fulfilled: { status: 409, error: "This ticket isn't fully paid yet" },
  not_single: { status: 409, error: "Only single tickets can be transferred" },
  checked_in: { status: 409, error: "This ticket has already been checked in" },
  event_started: { status: 409, error: "This event has already started" },
  recipient_not_found: { status: 409, error: RECIPIENT_MESSAGES.recipient_not_found },
  recipient_inactive: { status: 409, error: RECIPIENT_MESSAGES.recipient_inactive },
  recipient_unlinked: { status: 409, error: RECIPIENT_MESSAGES.recipient_unlinked },
  self_transfer: { status: 409, error: RECIPIENT_MESSAGES.self_transfer },
};

export type TransferResult =
  | { ok: true; transferId: string; reference: string; recipient: string }
  | { ok: false; code: string; status: 404 | 409; error: string };

/** Atomic transfer via transfer_order_item (moves owner, rotates qr_token, logs). */
export async function transferTicket(opts: {
  userId: string;
  ticketId: string;
  username: string;
}): Promise<TransferResult> {
  const db = getServerSupabase();
  const { data, error } = await db.rpc("transfer_order_item", {
    p_order_item_id: opts.ticketId,
    p_from_user_id: opts.userId,
    p_to_username: opts.username,
  });

  if (error) {
    throw new Error(error.message || "Transfer failed");
  }

  const res = (data || {}) as Record<string, any>;
  if (res.ok) {
    return {
      ok: true,
      transferId: String(res.transfer_id),
      reference: String(res.reference),
      recipient: String(res.to_username),
    };
  }

  const code = String(res.error_code || "unknown");
  const mapped = TRANSFER_ERRORS[code] || {
    status: 409 as const,
    error: "This transfer couldn't be completed",
  };
  return { ok: false, code, ...mapped };
}
