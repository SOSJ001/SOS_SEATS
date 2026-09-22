/**
 * Server fulfill for Monime payment-code webhooks (roadmap 5.4 / FR-34 / FR-35).
 * Idempotent on payment code id as orders.transaction_hash.
 * Do not import from client components.
 */
import { getServerSupabase } from "$lib/server/db";
import {
  claimTickets,
  findOrderByTransactionHash,
} from "$lib/server/tickets";
import { getMonimeCredentials } from "./monimeEnv";

export type FulfillPaymentCodeResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      skipped?: boolean;
      reason?: string;
    }
  | { ok: false; error: string; status?: number };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function parseSelectedTickets(raw: unknown): Record<string, number> | null {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const rec = asRecord(parsed);
  if (!rec) return null;
  const out: Record<string, number> = {};
  for (const [id, qty] of Object.entries(rec)) {
    const n = Number(qty);
    if (Number.isFinite(n) && n > 0) out[id] = n;
  }
  return Object.keys(out).length ? out : null;
}

async function fetchPaymentCodeFromMonime(
  codeId: string
): Promise<Record<string, unknown> | null> {
  const creds = getMonimeCredentials();
  if (!creds) return null;
  const response = await fetch(
    `https://api.monime.io/v1/payment-codes/${encodeURIComponent(codeId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        "Monime-Space-Id": creds.spaceId,
        "Monime-Version": "caph.2025-08-23",
      },
    }
  );
  if (!response.ok) return null;
  const json = await response.json().catch(() => null);
  const result = asRecord(json)?.result ?? json;
  return asRecord(result);
}

async function attachBuyerId(
  orderId: string,
  buyerId: string,
  paymentMethod: string
) {
  const db = getServerSupabase();
  await db
    .from("orders")
    .update({ buyer_id: buyerId, payment_method: paymentMethod })
    .eq("id", orderId);
}

/**
 * Fulfill a marketplace payment code into a plural order.
 * Skips private_issue and incomplete metadata (200 no-op for webhook).
 */
export async function fulfillPaymentCode(input: {
  paymentCodeId: string;
  metadata?: Record<string, unknown> | null;
  data?: Record<string, unknown> | null;
}): Promise<FulfillPaymentCodeResult> {
  const paymentCodeId = String(input.paymentCodeId || "").trim();
  if (!paymentCodeId) {
    return { ok: false, error: "Missing payment code id", status: 400 };
  }

  let metadata = asRecord(input.metadata) || asRecord(input.data?.metadata);
  let data = asRecord(input.data);

  if (metadata?.purpose === "private_issue") {
    return {
      ok: true,
      orderId: "",
      orderNumber: "",
      skipped: true,
      reason: "private_issue",
    };
  }

  if (!metadata?.event_id || !metadata?.selected_tickets) {
    const remote = await fetchPaymentCodeFromMonime(paymentCodeId);
    if (remote) {
      data = remote;
      metadata = asRecord(remote.metadata) || metadata;
    }
  }

  if (!metadata) {
    return {
      ok: true,
      orderId: "",
      orderNumber: "",
      skipped: true,
      reason: "missing_metadata",
    };
  }

  if (metadata.purpose === "private_issue") {
    return {
      ok: true,
      orderId: "",
      orderNumber: "",
      skipped: true,
      reason: "private_issue",
    };
  }

  const eventId = String(metadata.event_id || "").trim();
  const selectedTickets = parseSelectedTickets(metadata.selected_tickets);
  if (!eventId || !selectedTickets) {
    return {
      ok: true,
      orderId: "",
      orderNumber: "",
      skipped: true,
      reason: "not_marketplace",
    };
  }

  const paymentMethod = String(
    metadata.payment_method || "orange_money"
  ).trim();
  const buyerId = metadata.buyer_id ? String(metadata.buyer_id) : "";
  const buyerName = String(metadata.buyer_name || "Guest User");
  const phone = metadata.phone ? String(metadata.phone) : undefined;

  // Idempotency: payment code id only (stable across processed + completed)
  const existing = await findOrderByTransactionHash(
    paymentCodeId,
    eventId,
    paymentMethod
  );
  if (existing) {
    if (buyerId) {
      await attachBuyerId(existing.id, buyerId, paymentMethod);
    }
    return {
      ok: true,
      orderId: existing.id,
      orderNumber: existing.order_number,
    };
  }

  // Also try orange_money if RPC hardcodes that method historically
  if (paymentMethod !== "orange_money") {
    const existingOm = await findOrderByTransactionHash(
      paymentCodeId,
      eventId,
      "orange_money"
    );
    if (existingOm) {
      if (buyerId) {
        await attachBuyerId(existingOm.id, buyerId, paymentMethod);
      }
      return {
        ok: true,
        orderId: existingOm.id,
        orderNumber: existingOm.order_number,
      };
    }
  }

  const amountCents =
    asRecord(asRecord(data?.progress)?.totalPaymentSum)?.value ??
    asRecord(data?.amount)?.value;
  const totalAmount =
    typeof amountCents === "number"
      ? amountCents / 100
      : Number(metadata.total_with_fee || metadata.total_amount || 0);

  const result = await claimTickets(
    eventId,
    selectedTickets,
    {
      id: buyerId || undefined,
      name: buyerName,
      phone,
    },
    {
      paymentMethod,
      transactionSignature: paymentCodeId,
      amount: totalAmount,
      currency: "SLE",
      receivingWallet: `monime_${paymentMethod}`,
      buyerWallet: `mobile_money_${paymentMethod}`,
      provider: "monime",
      sessionId: paymentCodeId,
    }
  );

  if (result.success) {
    if (buyerId) {
      await attachBuyerId(result.orderId, buyerId, paymentMethod);
    }
    return {
      ok: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    };
  }

  // Concurrent webhook race: re-lookup
  const raced = await findOrderByTransactionHash(
    paymentCodeId,
    eventId,
    paymentMethod
  );
  if (raced) {
    if (buyerId) {
      await attachBuyerId(raced.id, buyerId, paymentMethod);
    }
    return {
      ok: true,
      orderId: raced.id,
      orderNumber: raced.order_number,
    };
  }

  const racedOm = await findOrderByTransactionHash(
    paymentCodeId,
    eventId,
    "orange_money"
  );
  if (racedOm) {
    if (buyerId) {
      await attachBuyerId(racedOm.id, buyerId, paymentMethod);
    }
    return {
      ok: true,
      orderId: racedOm.id,
      orderNumber: racedOm.order_number,
    };
  }

  return { ok: false, error: result.error || "Fulfill failed", status: 500 };
}
