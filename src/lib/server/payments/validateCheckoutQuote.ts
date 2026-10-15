/**
 * Marketplace checkout quote check before a Monime payment code is created
 * (roadmap 5.8 / FR-33). Rejects stale prices and inactive or free types.
 * Do not import from client components.
 */
import { getServerSupabase } from "$lib/server/db";
import { calculateBookingFee } from "$lib/fees.js";
import { parseSelectedTickets } from "./fulfillPaymentCode";
import { isEventOnSale } from "$lib/server/events/onSale";

export type CheckoutQuoteResult =
  | { ok: true; eventId: string; selected: Record<string, number>; chargeCents: number }
  | {
      ok: false;
      code: "unavailable" | "price_changed" | "invalid_selection";
      message: string;
    };

const INVALID: CheckoutQuoteResult = {
  ok: false,
  code: "invalid_selection",
  message: "This ticket selection is no longer valid. Please choose your ticket again.",
};

function parsePrice(price: unknown): number {
  return typeof price === "string" ? parseFloat(price) : Number(price) || 0;
}

export async function validateCheckoutQuote(input: {
  metadata?: Record<string, unknown> | null;
  amount?: { currency?: string; value?: number } | null;
}): Promise<CheckoutQuoteResult> {
  const eventId = String(input.metadata?.event_id || "").trim();
  const selected = parseSelectedTickets(input.metadata?.selected_tickets);
  if (!eventId || !selected || input.amount?.currency !== "SLE") {
    return INVALID;
  }

  const ids = Object.keys(selected);
  const totalQty = Object.values(selected).reduce((sum, n) => sum + n, 0);
  if (totalQty !== 1) {
    return INVALID;
  }

  const supabase = getServerSupabase();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("status, event_visibility")
    .eq("id", eventId)
    .maybeSingle();
  if (eventError) {
    throw new Error(eventError.message);
  }
  if (!isEventOnSale(event)) {
    return {
      ok: false,
      code: "unavailable",
      message: "Tickets for this event are not on sale.",
    };
  }

  const { data, error } = await supabase
    .from("ticket_types")
    .select("id, price, is_active")
    .eq("event_id", eventId)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }
  if (!data || data.length !== ids.length) {
    return INVALID;
  }

  let base = 0;
  for (const row of data) {
    const qty = selected[row.id] || 0;
    const price = parsePrice(row.price);
    // Stock is checked by create_checkout_hold, which also counts other buyers' holds.
    if (row.is_active === false) {
      return {
        ok: false,
        code: "unavailable",
        message: "Sorry, this ticket is no longer available.",
      };
    }
    if (price <= 0) {
      return INVALID;
    }
    base += price * qty;
  }

  const expectedCents = Math.round((base + calculateBookingFee(base)) * 100);
  if (Number(input.amount?.value) !== expectedCents) {
    return {
      ok: false,
      code: "price_changed",
      message: "The ticket price has changed. Please review the new total before paying.",
    };
  }

  return { ok: true, eventId, selected, chargeCents: expectedCents };
}
