/**
 * Wallet page text and colours (HI-FI desktop-wallet 55:1642, wallet-proceeds 4:796).
 * Rows come from /api/wallet/data?action=history; amounts there are positive.
 */
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
      status: "paid" | "refunded";
    }
  | {
      /** Private ticket fee paid by mobile money; not taken from the balance */
      kind: "private_payment";
      id: string;
      createdAt: string;
      eventName: string | null;
      quantity: number | null;
      amount: number;
      status: "paid" | "not_issued" | "waiting" | "cancelled";
    };

export type WalletHistoryFilter = "all" | "sales" | "withdrawals";
export type WithdrawProvider = "orange_money" | "afrimoney";

export const WITHDRAW_PROVIDERS: { id: WithdrawProvider; label: string }[] = [
  { id: "orange_money", label: "Orange Money" },
  { id: "afrimoney", label: "Afrimoney" },
];
export type WalletLayout = "desktop" | "mobile";
export type WalletStatusTone = "green" | "red" | "amber";

const TIME_ZONE = "Africa/Freetown";

const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: TIME_ZONE,
});

export function formatNle(amount: number): string {
  const n = Number(amount) || 0;
  return `NLe ${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "Apr 14, 09:12" */
export function formatWalletDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateTimeFormat.format(d);
}

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });
const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

/** "Today • 09:12", "Yesterday • 18:40" or "Apr 12 • 09:12" */
export function formatWalletDayTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = dayKeyFormat.format(d);
  const today = dayKeyFormat.format(new Date());
  const yesterday = dayKeyFormat.format(new Date(Date.now() - 86_400_000));
  const label = day === today ? "Today" : day === yesterday ? "Yesterday" : dateFormat.format(d);
  return `${label} • ${timeFormat.format(d)}`;
}

/** "Apr 14" */
export function formatWalletDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateFormat.format(d);
}

export function providerLabel(provider: string): string {
  if (provider === "orange_money") return "Orange Money";
  if (provider === "afrimoney") return "Afrimoney";
  return "Mobile Money";
}

export function rowTitle(row: WalletHistoryRow, layout: WalletLayout): string {
  if (row.kind === "sale") {
    if (layout === "mobile") return row.eventName;
    return `${row.eventName} Ticket Sale${row.orderNumber ? ` #${row.orderNumber}` : ""}`;
  }
  if (row.kind === "withdrawal") {
    const provider = providerLabel(row.provider);
    return layout === "mobile" ? `Withdrawal to ${provider}` : `${provider} Withdrawal`;
  }
  const qty = row.quantity ? ` x${row.quantity}` : "";
  return `Private tickets${qty}${row.eventName ? `, ${row.eventName}` : ""}`;
}

export function rowTypeLabel(row: WalletHistoryRow): string {
  if (row.kind === "sale") return "Ticket sale";
  if (row.kind === "withdrawal") return "Withdrawal";
  if (row.kind === "private_payment") return "Fee (mobile money)";
  return "Fee";
}

export function rowAmount(row: WalletHistoryRow): string {
  if (row.kind === "sale") return `+${formatNle(row.amount)}`;
  if (row.kind === "withdrawal" && row.status === "failed") return formatNle(row.amount);
  if (row.kind === "fee" && row.status === "refunded") return formatNle(row.amount);
  if (row.kind === "private_payment") return formatNle(row.amount);
  return `-${formatNle(row.amount)}`;
}

export function rowAmountClass(row: WalletHistoryRow, layout: WalletLayout): string {
  if (row.kind === "sale") return "text-[#00e676]";
  if (row.kind === "private_payment") return "text-ink-secondary";
  if (row.kind === "fee") {
    return row.status === "refunded" ? "text-ink-secondary" : "text-[#ef4444]";
  }
  if (row.status === "failed") return "text-ink-secondary";
  return layout === "mobile" ? "text-[#ff1744]" : "text-brand";
}

export function rowStatusLabel(row: WalletHistoryRow): string {
  if (row.kind === "sale") {
    if (row.status === "available") return "Available";
    return row.heldUntil ? `Held until ${formatWalletDateTime(row.heldUntil)}` : "Held";
  }
  if (row.kind === "withdrawal") {
    if (row.status === "failed") return "Failed";
    if (row.status === "on_its_way") return "On its way";
    if (row.status === "on_hold") return "On hold";
    return "Completed";
  }
  if (row.kind === "private_payment") {
    if (row.status === "not_issued") return "Paid, tickets not issued";
    if (row.status === "waiting") return "Waiting for payment";
    if (row.status === "cancelled") return "Cancelled";
    return "Paid";
  }
  return row.status === "refunded" ? "Refunded" : "Paid";
}

export function rowStatusTone(row: WalletHistoryRow): WalletStatusTone {
  if (row.kind === "sale") return row.status === "held" ? "amber" : "green";
  if (row.kind === "withdrawal") {
    if (row.status === "failed") return "red";
    if (row.status === "on_its_way" || row.status === "on_hold") return "amber";
  }
  if (row.kind === "private_payment") {
    if (row.status === "waiting") return "amber";
    if (row.status === "not_issued" || row.status === "cancelled") return "red";
  }
  if (row.kind === "fee" && row.status === "refunded") return "amber";
  return "green";
}
