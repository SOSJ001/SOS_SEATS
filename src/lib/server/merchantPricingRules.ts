import { env } from "$env/dynamic/private";
import {
  limitsForRegion,
  normalizePricingCurrency,
  parseLimitsOverridesJson,
  type PricingRegion,
} from "$lib/config/monimeLimits";

export type TicketTypeInput = {
  price?: number | string | null;
  name?: string;
};

export type VenueSectionInput = {
  price?: number | string | null;
  name?: string;
};

export type ValidateMerchantPricingInput = {
  is_free_event: boolean;
  ticket_types?: TicketTypeInput[];
  venue_sections?: VenueSectionInput[];
  /** ISO-ish region for default currency limits (SL, UK, DEFAULT) */
  merchant_pricing_region?: string;
  /** Explicit currency for paid tickets when set on types */
  default_currency?: string | null;
};

export type PricingValidationFailure = {
  ok: false;
  error: string;
  code:
    | "TICKET_PRICE_INVALID"
    | "TICKET_PRICE_BELOW_MINIMUM"
    | "SECTION_PRICE_BELOW_MINIMUM";
};

export type PricingValidationSuccess = { ok: true };

export type PricingValidationResult = PricingValidationSuccess | PricingValidationFailure;

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Validates paid ticket and section prices against configured Monime-friendly minimums.
 */
export function validateMerchantEventPricing(
  input: ValidateMerchantPricingInput
): PricingValidationResult {
  if (input.is_free_event) {
    return { ok: true };
  }

  const region = (input.merchant_pricing_region || "SL") as PricingRegion;
  const defaultCur = normalizePricingCurrency(
    input.default_currency || (region === "UK" ? "GBP" : "SLE")
  );
  const overrides = parseLimitsOverridesJson(env.MONIME_PRICING_LIMITS_JSON);
  const { minTicketPrice } = limitsForRegion(region, overrides);

  const tickets = input.ticket_types || [];
  for (const t of tickets) {
    const price = toNumber(t.price);
    if (price === null) continue;
    if (price < 0) {
      return {
        ok: false,
        error: `Invalid ticket price for "${t.name || "ticket"}".`,
        code: "TICKET_PRICE_INVALID",
      };
    }
    if (price === 0) {
      return {
        ok: false,
        error: `Paid events require a positive ticket price (minimum ${defaultCur} ${minTicketPrice}) for "${t.name || "ticket"}".`,
        code: "TICKET_PRICE_BELOW_MINIMUM",
      };
    }
    if (price < minTicketPrice) {
      return {
        ok: false,
        error: `Ticket "${t.name || "ticket"}" price must be at least ${defaultCur} ${minTicketPrice} for this region.`,
        code: "TICKET_PRICE_BELOW_MINIMUM",
      };
    }
  }

  const sections = input.venue_sections || [];
  for (const s of sections) {
    const price = toNumber(s.price);
    if (price === null || price === 0) continue;
    if (price < 0) {
      return {
        ok: false,
        error: `Invalid section price for "${s.name || "section"}".`,
        code: "TICKET_PRICE_INVALID",
      };
    }
    if (price < minTicketPrice) {
      return {
        ok: false,
        error: `Venue section "${s.name || "section"}" price must be at least ${defaultCur} ${minTicketPrice}.`,
        code: "SECTION_PRICE_BELOW_MINIMUM",
      };
    }
  }

  return { ok: true };
}
