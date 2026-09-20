/**
 * Private ticket issue fee (roadmap 4.5 / FR-41).
 * Fixed gateway fee 0.99 NLe per ticket. No organiser 5% / buyer booking fee.
 */
import { getServerSupabase } from "$lib/server/db";
import { insertWalletTransaction, listOrganizerOrders } from "$lib/server/wallet";
import { assertEventOwnedByUser } from "$lib/server/events";

export const PRIVATE_ISSUE_FEE_NLE = 0.99;
export const PRIVATE_INVITE_TYPE_NAME = "Private Invite";

export function privateIssueFeeTotal(qty: number): number {
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  return Math.round(n * PRIVATE_ISSUE_FEE_NLE * 100) / 100;
}

/** Organiser NLe proceeds: MM order deposits minus completed MM withdrawals. */
export async function getOrganiserNleBalance(
  userId: string,
  walletAddress: string | null | undefined
): Promise<number> {
  const { data: orders } = await listOrganizerOrders(userId, {
    paymentMethods: ["orange_money", "afrimoney"],
    paymentStatuses: ["paid", "completed"],
    limit: 500,
    select: "id, total_amount, payment_method, payment_status",
  });

  const deposits = (orders || []).reduce((sum, r: any) => {
    const amt =
      typeof r.total_amount === "string"
        ? parseFloat(r.total_amount)
        : r.total_amount || 0;
    return sum + (isFinite(amt) ? amt : 0);
  }, 0);

  let withdrawals = 0;
  const wallet = walletAddress || `user:${userId}`;
  const db = getServerSupabase();
  const { data: txs } = await db
    .from("wallet_transactions")
    .select("amount, source, status, type, metadata")
    .eq("wallet_address", wallet)
    .eq("type", "withdrawal")
    .in("status", ["completed", "paid"])
    .limit(500);

  for (const t of txs || []) {
    const src = String(t.source || "");
    const meta = t.metadata || {};
    const isMm = ["mobile_money", "orange_money", "afrimoney"].includes(src);
    const isIssue =
      src === "private_issue" || meta?.purpose === "private_issue";
    if (!isMm && !isIssue) continue;
    const amt =
      typeof t.amount === "string" ? parseFloat(t.amount) : t.amount || 0;
    withdrawals += Math.abs(isFinite(amt) ? amt : 0);
  }

  // Also count private_issue withdrawals stored under user: id when wallet differs
  if (walletAddress && walletAddress !== `user:${userId}`) {
    const { data: userTxs } = await db
      .from("wallet_transactions")
      .select("amount, source, status, type, metadata")
      .eq("wallet_address", `user:${userId}`)
      .eq("type", "withdrawal")
      .in("status", ["completed", "paid"])
      .limit(200);
    for (const t of userTxs || []) {
      const meta = t.metadata || {};
      if (t.source !== "private_issue" && meta?.purpose !== "private_issue") {
        continue;
      }
      const amt =
        typeof t.amount === "string" ? parseFloat(t.amount) : t.amount || 0;
      withdrawals += Math.abs(isFinite(amt) ? amt : 0);
    }
  }

  return Math.max(0, Math.round((deposits - withdrawals) * 100) / 100);
}

async function ensurePrivateInviteTicketType(
  eventId: string
): Promise<{ id: string; name: string } | null> {
  const db = getServerSupabase();
  const { data: existing } = await db
    .from("ticket_types")
    .select("id, name")
    .eq("event_id", eventId)
    .eq("name", PRIVATE_INVITE_TYPE_NAME)
    .maybeSingle();

  if (existing?.id) return existing;

  const { data: created, error } = await db
    .from("ticket_types")
    .insert([
      {
        event_id: eventId,
        name: PRIVATE_INVITE_TYPE_NAME,
        description: "Privately generated organiser invite",
        price: 0,
        quantity: 999999,
        sold_quantity: 0,
        is_active: true,
      },
    ])
    .select("id, name")
    .maybeSingle();

  if (error || !created) return null;
  return created;
}

export type PrivateIssueResult =
  | { success: true; guests: any[]; feeTotal: number; qty: number }
  | { success: false; error: string };

/**
 * Insert qty private-issued guests. Caller must have already collected payment
 * (wallet debit or MM fulfill).
 */
export async function issuePrivateGuests(opts: {
  eventId: string;
  userId: string;
  qty: number;
}): Promise<PrivateIssueResult> {
  const qty = Math.floor(Number(opts.qty) || 0);
  if (qty < 1) return { success: false, error: "Quantity must be at least 1" };
  if (qty > 500) return { success: false, error: "Quantity too large" };

  const owned = await assertEventOwnedByUser(opts.eventId, opts.userId);
  if (!owned) return { success: false, error: "Event not found or unauthorized" };

  const ticketType = await ensurePrivateInviteTicketType(opts.eventId);
  if (!ticketType) {
    return { success: false, error: "Could not create Private Invite ticket type" };
  }

  const db = getServerSupabase();
  const rows: Record<string, any>[] = [];

  for (let i = 0; i < qty; i++) {
    const { data: ticketNumber, error: tnErr } = await db.rpc(
      "generate_ticket_number"
    );
    if (tnErr || !ticketNumber) {
      return { success: false, error: "Failed to generate ticket number" };
    }
    const n = String(i + 1).padStart(3, "0");
    rows.push({
      event_id: opts.eventId,
      ticket_type_id: ticketType.id,
      first_name: "Private",
      last_name: n,
      email: null,
      phone: null,
      ticket_number: ticketNumber,
      status: "issued",
      special_requirements: "private_issue",
    });
  }

  const { data: guests, error } = await db.from("guests").insert(rows).select();
  if (error) return { success: false, error: error.message };

  // Bump sold_quantity on private invite type
  const { data: tt } = await db
    .from("ticket_types")
    .select("sold_quantity")
    .eq("id", ticketType.id)
    .maybeSingle();
  await db
    .from("ticket_types")
    .update({
      sold_quantity: (Number(tt?.sold_quantity) || 0) + qty,
    })
    .eq("id", ticketType.id);

  return {
    success: true,
    guests: guests || [],
    feeTotal: privateIssueFeeTotal(qty),
    qty,
  };
}

export async function debitWalletForPrivateIssue(opts: {
  userId: string;
  walletAddress: string | null | undefined;
  eventId: string;
  qty: number;
  feeTotal: number;
}): Promise<{ success: true } | { success: false; error: string }> {
  const balance = await getOrganiserNleBalance(
    opts.userId,
    opts.walletAddress
  );
  if (balance < opts.feeTotal) {
    return {
      success: false,
      error: `Insufficient wallet balance (NLe ${balance.toFixed(2)} available, NLe ${opts.feeTotal.toFixed(2)} due)`,
    };
  }

  const wallet = opts.walletAddress || `user:${opts.userId}`;
  const { error } = await insertWalletTransaction({
    wallet_address: wallet,
    type: "withdrawal",
    source: "private_issue",
    status: "completed",
    amount: -Math.abs(opts.feeTotal),
    currency: "NLe",
    description: `Private ticket issue × ${opts.qty}`,
    metadata: {
      purpose: "private_issue",
      event_id: opts.eventId,
      qty: opts.qty,
      fee_each: PRIVATE_ISSUE_FEE_NLE,
      fee_total: opts.feeTotal,
      user_id: opts.userId,
    },
  });

  if (error) return { success: false, error };
  return { success: true };
}

export async function issuePrivateTicketsWithWallet(opts: {
  eventId: string;
  userId: string;
  walletAddress: string | null | undefined;
  qty: number;
}): Promise<PrivateIssueResult> {
  const qty = Math.floor(Number(opts.qty) || 0);
  const feeTotal = privateIssueFeeTotal(qty);
  if (qty < 1) return { success: false, error: "Quantity must be at least 1" };

  const debit = await debitWalletForPrivateIssue({
    userId: opts.userId,
    walletAddress: opts.walletAddress,
    eventId: opts.eventId,
    qty,
    feeTotal,
  });
  if (!debit.success) return debit;

  const issued = await issuePrivateGuests({
    eventId: opts.eventId,
    userId: opts.userId,
    qty,
  });
  if (!issued.success) {
    // Best-effort: do not auto-refund in v1; surface error
    return issued;
  }
  return issued;
}

export function isPrivateIssuedGuest(guest: {
  status?: string;
  ticketType?: string;
  ticket_type?: string;
  special_requirements?: string | null;
}): boolean {
  const status = String(guest.status || "").toLowerCase();
  const type = String(
    guest.ticketType || guest.ticket_type || ""
  ).toLowerCase();
  const req = String(guest.special_requirements || "").toLowerCase();
  return (
    status === "issued" ||
    type === PRIVATE_INVITE_TYPE_NAME.toLowerCase() ||
    req === "private_issue"
  );
}
