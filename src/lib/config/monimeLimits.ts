/**
 * Minimum ticket / charge amounts in major currency units (e.g. SLE, GBP).
 * Optional JSON overrides are merged in `limitsForRegion` (see server caller).
 */
export type PricingRegion = "SL" | "UK" | "DEFAULT";

export const DEFAULT_MONIME_LIMITS: Record<string, { minTicketPrice: number }> = {
  SLE: { minTicketPrice: 1 },
  NLe: { minTicketPrice: 1 },
  GBP: { minTicketPrice: 0.3 },
  DEFAULT: { minTicketPrice: 1 },
};

export function parseLimitsOverridesJson(
  raw: string | undefined
): Record<string, { minTicketPrice: number }> | null {
  if (!raw || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, { minTicketPrice?: number }>;
    const out: Record<string, { minTicketPrice: number }> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v?.minTicketPrice === "number" && Number.isFinite(v.minTicketPrice)) {
        out[k.toUpperCase()] = { minTicketPrice: v.minTicketPrice };
      }
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

export function normalizePricingCurrency(currency: string | undefined | null): string {
  if (!currency || typeof currency !== "string") return "SLE";
  const c = currency.trim();
  if (c === "NLe" || c === "SLL") return "SLE";
  return c.toUpperCase();
}

export function limitsForRegion(
  region: PricingRegion | string | undefined,
  overrides?: Record<string, { minTicketPrice: number }> | null
): { minTicketPrice: number } {
  const r = (region || "DEFAULT").toString().toUpperCase();
  const key = r === "SL" ? "SLE" : r === "UK" ? "GBP" : "DEFAULT";
  const merged = { ...DEFAULT_MONIME_LIMITS, ...(overrides || {}) };
  return merged[key] || merged.DEFAULT;
}
