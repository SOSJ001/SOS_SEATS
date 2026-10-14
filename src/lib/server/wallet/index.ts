/**
 * Rebuild server domain: wallet (roadmap 3.2).
 * Kit-privileged wallet_transactions I/O via getServerSupabase after cookie authz.
 * Do not import from client components.
 */
import { getServerSupabase } from "$lib/server/db";

/**
 * The wallet_transactions.wallet_address an organiser's ledger rows live under.
 * Always derived from the signed session, never from the request.
 */
export function getLedgerKey(locals: {
  userId: string | null;
  linkedWalletAddress?: string | null;
  walletAddress?: string | null;
}): string | null {
  if (!locals.userId) return null;
  return (
    locals.linkedWalletAddress || locals.walletAddress || `user:${locals.userId}`
  );
}

/** Withdrawal statuses that hold money: paid out or on its way. */
export const RESERVED_WITHDRAWAL_STATUSES = [
  "completed",
  "paid",
  "pending",
  "processing",
];

export async function listWalletTransactions(
  walletAddress: string,
  opts?: { limit?: number; type?: string; status?: string }
): Promise<{ data: any[]; error: string | null }> {
  try {
    const db = getServerSupabase();
    let query = db
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_address", walletAddress)
      .order("created_at", { ascending: false });

    if (opts?.type) query = query.eq("type", opts.type);
    if (opts?.status) query = query.eq("status", opts.status);
    if (opts?.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || "Failed to list transactions" };
  }
}

export async function getWalletTransactionById(
  id: string,
  walletAddress?: string
): Promise<{ data: any | null; error: string | null }> {
  try {
    const db = getServerSupabase();
    let query = db.from("wallet_transactions").select("*").eq("id", id);
    if (walletAddress) query = query.eq("wallet_address", walletAddress);
    const { data, error } = await query.maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "Failed to load transaction" };
  }
}

export async function insertWalletTransaction(
  row: Record<string, any>
): Promise<{ data: any | null; error: string | null }> {
  try {
    const db = getServerSupabase();
    const { data, error } = await db
      .from("wallet_transactions")
      .insert([row])
      .select()
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "Insert failed" };
  }
}

export async function updateWalletTransaction(
  id: string,
  updates: Record<string, any>,
  walletAddress?: string
): Promise<{ data: any | null; error: string | null }> {
  try {
    const db = getServerSupabase();
    let query = db.from("wallet_transactions").update(updates).eq("id", id);
    if (walletAddress) query = query.eq("wallet_address", walletAddress);
    const { data, error } = await query.select().maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "Update failed" };
  }
}

export async function listOrdersForWallet(
  walletAddress: string
): Promise<{ data: any[]; error: string | null }> {
  try {
    const db = getServerSupabase();
    const { data, error } = await db
      .from("orders")
      .select("*")
      .eq("buyer_wallet_address", walletAddress)
      .order("created_at", { ascending: false });
    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || "Failed to list orders" };
  }
}

export async function getOrderById(
  orderId: string
): Promise<{ data: any | null; error: string | null }> {
  try {
    const db = getServerSupabase();
    const { data, error } = await db
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "Failed to load order" };
  }
}

/** Orders for events owned by userId (organizer revenue / wallet dashboard). */
export async function listOrganizerOrders(
  userId: string,
  opts?: {
    eventId?: string;
    paymentMethods?: string[];
    paymentStatuses?: string[];
    limit?: number;
    offset?: number;
    select?: string;
  }
): Promise<{ data: any[]; error: string | null }> {
  try {
    const db = getServerSupabase();
    const select =
      opts?.select ||
      "id, created_at, total_amount, currency, payment_method, payment_status, order_number, event_id, events!inner(id, name, user_id, date, location)";
    let query = db
      .from("orders")
      .select(select)
      .eq("events.user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (opts?.eventId) query = query.eq("event_id", opts.eventId);
    if (opts?.paymentMethods?.length) {
      query = query.in("payment_method", opts.paymentMethods);
    }
    if (opts?.paymentStatuses?.length) {
      query = query.in("payment_status", opts.paymentStatuses);
    }
    if (opts?.limit && opts?.offset !== undefined) {
      query = query.range(opts.offset, opts.offset + opts.limit - 1);
    } else if (opts?.limit) {
      query = query.limit(opts.limit);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || "Failed to list organizer orders" };
  }
}
