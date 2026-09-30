/**
 * Ticket Transfers page load (roadmap 6.2 / FR-21), HI-FI 604:1579 + 306:76, history 606:1343 + 311:174.
 * Transfer form checks (desktop 55:708, mobile 36:890): ticket eligibility + recipient username.
 * Cookie-authz Kit read via loadMyTicketsForBuyer (buyer_id = session user).
 * Transfer counts and history stay empty until the 6.2b transfer backend lands.
 */
import { getServerSupabase } from "$lib/server/db";
import { normalizeUsername } from "$lib/server/auth/username";
import { loadMyTicketsForBuyer, formatTierLabel, type MyTicketRow } from "./index";

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
  /** Date tile parts, e.g. "FEB" / "18". */
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

export function emptyTransfersPayload(userName = "Attendee"): TransfersPayload {
  return {
    userName: userName || "Attendee",
    tickets: [],
    next: null,
    stats: { total: 0, completed: 0 },
    history: [],
  };
}

export async function loadTransfersPage(
  userId: string,
  userName = "Attendee"
): Promise<TransfersPayload> {
  if (!userId) return emptyTransfersPayload(userName);

  const base = await loadMyTicketsForBuyer(userId, userName);

  const tickets: TransferTicketRow[] = base.upcoming
    .filter((row) => row.status === "VALID")
    .map((row) => ({
      ...row,
      tierLabel: formatTierLabel(row.ticketTypeName, row.price, row.isFree),
    }));

  return {
    userName: base.userName,
    tickets,
    next: tickets[0] ?? null,
    stats: { total: 0, completed: 0 },
    history: [],
  };
}

/** Eligible ticket (VALID, upcoming, owned by the session user) or null. */
export async function loadTransferTicket(
  userId: string,
  userName: string,
  ticketId: string
): Promise<TransferTicketRow | null> {
  if (!userId || !ticketId) return null;
  const { tickets } = await loadTransfersPage(userId, userName);
  return tickets.find((t) => t.id === ticketId) ?? null;
}

export type RecipientCheck =
  | { ok: true; username: string }
  | { ok: false; error: string };

/**
 * Recipient must be an active username account with a linked Auth user
 * (My Tickets loads by orders.buyer_id = Auth id) and not the sender.
 * Self is matched on ids only: locals.userName can fall back to a display name.
 */
export async function validateTransferRecipient(opts: {
  userId: string | null;
  web3UserId: string | null;
  raw: unknown;
}): Promise<RecipientCheck> {
  const input = typeof opts.raw === "string" ? opts.raw.trim().replace(/^@/, "") : "";
  const norm = normalizeUsername(input);
  if (!norm.ok) return { ok: false, error: norm.error };

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
    return { ok: false, error: "No SOS SEATS account with that username" };
  }
  if (data.is_active === false) {
    return { ok: false, error: "That account isn't active" };
  }
  if (!data.linked_auth_user_id) {
    return { ok: false, error: "That account can't receive tickets yet" };
  }
  if (
    (opts.userId && data.linked_auth_user_id === opts.userId) ||
    (opts.web3UserId && data.id === opts.web3UserId)
  ) {
    return { ok: false, error: "You can't transfer a ticket to yourself" };
  }

  return { ok: true, username: data.username as string };
}
