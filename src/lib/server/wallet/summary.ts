/**
 * Organiser wallet figures and history (roadmap 8.1).
 * The 5% platform fee is taken at sale; ticket money is held until 24 hours
 * after the event starts. Do not import from client components, and do not
 * import from $lib/server/payments/privateIssue (it imports this file).
 */
import { getServerSupabase } from "$lib/server/db";
import { calculateSaleSplit } from "$lib/fees";
import { listOrganizerOrders, RESERVED_WITHDRAWAL_STATUSES } from "./index";

const HOLD_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;
const MOBILE_MONEY_SOURCES = ["mobile_money", "orange_money", "afrimoney"];
const IN_PROGRESS_STATUSES = ["pending", "processing"];
const HISTORY_WITHDRAWAL_STATUSES = [...RESERVED_WITHDRAWAL_STATUSES, "failed"];

const round2 = (n: number) => Math.round(n * 100) / 100;

const toNumber = (v: unknown) => {
  const n = typeof v === "string" ? parseFloat(v) : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export type WalletSummary = {
  available: number;
  pending: number;
  totalEarned: number;
  withdrawn: number;
  privateFees: number;
  /** `onHold`: no Monime payout id yet, so sync-payouts is still checking it */
  withdrawalInProgress: { id: string; amount: number; createdAt: string; onHold: boolean } | null;
};

export type WalletHistoryFilter = "all" | "sales" | "withdrawals";

/** Amounts are positive; `kind` says which way the money moved. */
export type WalletHistoryRow =
  | {
      kind: "sale";
      id: string;
      createdAt: string;
      eventName: string;
      orderNumber: string | null;
      amount: number;
      status: "held" | "available";
      heldUntil: string | null;
    }
  | {
      kind: "withdrawal";
      id: string;
      createdAt: string;
      provider: string;
      phoneMasked: string | null;
      amount: number;
      status: "completed" | "on_its_way" | "on_hold" | "failed";
    }
  | {
      kind: "fee";
      id: string;
      createdAt: string;
      eventName: string | null;
      quantity: number | null;
      amount: number;
      status: "paid";
    };

type Sale = {
  id: string;
  createdAt: string;
  eventName: string;
  orderNumber: string | null;
  organiserNet: number;
  releaseAt: Date | null;
  held: boolean;
  cancelled: boolean;
};

/**
 * When an event's ticket money becomes withdrawable: start time plus 24 hours.
 * Event date and time are stored without a time zone and read as UTC
 * (Sierra Leone is on GMT all year).
 */
export function getReleaseAt(
  date: string | null | undefined,
  time: string | null | undefined
): Date | null {
  const [y, m, d] = String(date || "").slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const [hh = 0, mm = 0, ss = 0] = String(time || "00:00:00")
    .split(":")
    .map((part) => Number(part) || 0);
  return new Date(Date.UTC(y, m - 1, d, hh, mm, Math.floor(ss)) + HOLD_MS);
}

async function loadSales(userId: string, now: Date, maxRows?: number): Promise<Sale[]> {
  const sales: Sale[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await listOrganizerOrders(userId, {
      paymentMethods: ["orange_money", "afrimoney"],
      paymentStatuses: ["paid", "completed"],
      limit: PAGE_SIZE,
      offset,
      select:
        "id, created_at, total_amount, order_number, event_id, events!inner(id, name, user_id, date, time, status)",
    });
    if (error) throw new Error(error);

    for (const o of data) {
      const event = Array.isArray(o.events) ? o.events[0] : o.events;
      const releaseAt = getReleaseAt(event?.date, event?.time);
      const cancelled = event?.status === "cancelled";
      sales.push({
        id: o.id,
        createdAt: o.created_at,
        eventName: event?.name || "Event",
        orderNumber: o.order_number ?? null,
        organiserNet: calculateSaleSplit(toNumber(o.total_amount)).organiserNet,
        releaseAt,
        held: cancelled || !releaseAt || now < releaseAt,
        cancelled,
      });
    }

    if (data.length < PAGE_SIZE || (maxRows && sales.length >= maxRows)) break;
  }
  return maxRows ? sales.slice(0, maxRows) : sales;
}

async function loadWithdrawalRows(
  walletAddress: string,
  statuses: string[],
  maxRows?: number
): Promise<any[]> {
  const db = getServerSupabase();
  const rows: any[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await db
      .from("wallet_transactions")
      .select("id, amount, source, status, type, metadata, external_id, created_at")
      .eq("wallet_address", walletAddress)
      .eq("type", "withdrawal")
      .in("status", statuses)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE || (maxRows && rows.length >= maxRows)) break;
  }
  return rows;
}

const isPrivateFee = (t: any) =>
  t.source === "private_issue" || t.metadata?.purpose === "private_issue";

const isMobileMoney = (t: any) => MOBILE_MONEY_SOURCES.includes(String(t.source || ""));

/**
 * Mobile money withdrawals and private ticket fees for this organiser, newest
 * first. Private ticket fees may also sit under `user:<id>` when the ledger
 * key is a linked wallet.
 */
async function loadLedger(
  userId: string,
  ledgerKey: string,
  statuses: string[],
  maxRows?: number
): Promise<any[]> {
  const rows = (await loadWithdrawalRows(ledgerKey, statuses, maxRows)).filter(
    (t) => isMobileMoney(t) || isPrivateFee(t)
  );
  const userKey = `user:${userId}`;
  if (ledgerKey !== userKey) {
    const extra = await loadWithdrawalRows(userKey, statuses, maxRows);
    rows.push(...extra.filter(isPrivateFee));
  }
  return rows.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getWalletSummary(
  userId: string,
  ledgerKey: string,
  now: Date = new Date()
): Promise<WalletSummary> {
  const [sales, ledger] = await Promise.all([
    loadSales(userId, now),
    loadLedger(userId, ledgerKey, RESERVED_WITHDRAWAL_STATUSES),
  ]);

  let released = 0;
  let pending = 0;
  for (const s of sales) {
    if (s.held) pending += s.organiserNet;
    else released += s.organiserNet;
  }

  let withdrawn = 0;
  let privateFees = 0;
  let withdrawalInProgress: WalletSummary["withdrawalInProgress"] = null;
  for (const t of ledger) {
    const amount = Math.abs(toNumber(t.amount));
    if (isPrivateFee(t)) {
      privateFees += amount;
      continue;
    }
    withdrawn += amount;
    if (!withdrawalInProgress && IN_PROGRESS_STATUSES.includes(t.status)) {
      withdrawalInProgress = {
        id: t.id,
        amount: round2(amount),
        createdAt: t.created_at,
        onHold: !t.external_id,
      };
    }
  }

  return {
    available: Math.max(0, round2(released - withdrawn - privateFees)),
    pending: round2(pending),
    totalEarned: round2(released + pending),
    withdrawn: round2(withdrawn),
    privateFees: round2(privateFees),
    withdrawalInProgress,
  };
}

/** "+23276543210" to "+232 7X XX XX XX"; the full number stays on the server. */
function maskPhone(phone: unknown): string | null {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!/^232\d{8}$/.test(digits)) return null;
  return `+232 ${digits[3]}X XX XX XX`;
}

function withdrawalStatus(t: any): "completed" | "on_its_way" | "on_hold" | "failed" {
  if (t.status === "failed") return "failed";
  if (IN_PROGRESS_STATUSES.includes(t.status)) return t.external_id ? "on_its_way" : "on_hold";
  return "completed";
}

async function loadEventNames(eventIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (!eventIds.length) return names;
  const { data, error } = await getServerSupabase()
    .from("events")
    .select("id, name")
    .in("id", eventIds);
  if (error) throw new Error(error.message);
  for (const e of data || []) names.set(e.id, e.name);
  return names;
}

export async function getWalletHistory(
  userId: string,
  ledgerKey: string,
  opts: { filter?: WalletHistoryFilter; limit?: number; now?: Date } = {}
): Promise<WalletHistoryRow[]> {
  const filter = opts.filter || "all";
  const limit = Math.max(1, Math.floor(opts.limit || 50));
  const now = opts.now || new Date();

  const [sales, ledger] = await Promise.all([
    filter === "withdrawals" ? Promise.resolve([]) : loadSales(userId, now, limit),
    filter === "sales"
      ? Promise.resolve([])
      : loadLedger(userId, ledgerKey, HISTORY_WITHDRAWAL_STATUSES, limit),
  ]);

  const rows: WalletHistoryRow[] = sales.map((s) => ({
    kind: "sale",
    id: s.id,
    createdAt: s.createdAt,
    eventName: s.eventName,
    orderNumber: s.orderNumber,
    amount: s.organiserNet,
    status: s.held ? "held" : "available",
    heldUntil: s.held && !s.cancelled && s.releaseAt ? s.releaseAt.toISOString() : null,
  }));

  const fees = filter === "all" ? ledger.filter(isPrivateFee) : [];
  const eventNames = await loadEventNames([
    ...new Set(fees.map((t) => t.metadata?.event_id).filter(Boolean) as string[]),
  ]);

  for (const t of ledger) {
    const amount = round2(Math.abs(toNumber(t.amount)));
    if (isPrivateFee(t)) {
      if (filter !== "all") continue;
      const qty = Number(t.metadata?.qty);
      rows.push({
        kind: "fee",
        id: t.id,
        createdAt: t.created_at,
        eventName: eventNames.get(t.metadata?.event_id) ?? null,
        quantity: Number.isFinite(qty) && qty > 0 ? qty : null,
        amount,
        status: "paid",
      });
      continue;
    }
    rows.push({
      kind: "withdrawal",
      id: t.id,
      createdAt: t.created_at,
      provider: String(t.metadata?.provider || t.source || "mobile_money"),
      phoneMasked: maskPhone(t.metadata?.phone_number),
      amount,
      status: withdrawalStatus(t),
    });
  }

  return rows
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
