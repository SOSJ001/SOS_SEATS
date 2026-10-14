// @ts-nocheck
/**
 * Shared fee rates from PUBLIC_* env (percent points, e.g. 0.99 = 0.99%).
 * One update in .env updates landing, checkout, wallet, and hub overview.
 * Uses $env/dynamic/public (SvelteKit) — import.meta.env[key] does not resolve PUBLIC_* here.
 */
import { env } from "$env/dynamic/public";

function readEnv(key) {
  return env?.[key];
}

function parsePercent(raw, fallback) {
  const n = parseFloat(raw ?? "");
  return Number.isFinite(n) ? n : fallback;
}

function formatPercentLabel(percentPoints) {
  const rounded =
    Math.abs(percentPoints - Math.round(percentPoints)) < 1e-9
      ? String(Math.round(percentPoints))
      : String(Number(percentPoints.toFixed(4)));
  return `${rounded}%`;
}

/** Buyer booking fee percent points (default 0.99). */
export function getBookingFeePercent() {
  return parsePercent(readEnv("PUBLIC_BOOKING_FEE_PERCENT"), 0.99);
}

/** Fraction for math (e.g. 0.0099). */
export function getBookingFeeRate() {
  return getBookingFeePercent() / 100;
}

/** True when PUBLIC_BOOKING_FEE_MODE=flat: a fixed NLe amount once per order instead of a percent. */
export function isBookingFeeFlat() {
  return String(readEnv("PUBLIC_BOOKING_FEE_MODE") || "").trim().toLowerCase() === "flat";
}

/** Flat booking fee in NLe per order (default 1). Only used when the mode is flat. */
export function getBookingFeeFlat() {
  return Math.max(0, parsePercent(readEnv("PUBLIC_BOOKING_FEE_FLAT"), 1));
}

/** Booking fee for a whole order. `baseTotal` is the ticket total for the order. */
export function calculateBookingFee(baseTotal) {
  const base = Number(baseTotal) || 0;
  if (base <= 0) return 0;
  if (isBookingFeeFlat()) return Math.round(getBookingFeeFlat() * 100) / 100;
  return Math.round(base * getBookingFeeRate() * 100) / 100;
}

/** Booking fee as shown to people: "1%" or "NLe 1". */
export function formatBookingFeeLabel() {
  if (!isBookingFeeFlat()) return formatPercentLabel(getBookingFeePercent());
  const flat = getBookingFeeFlat();
  return `NLe ${Number.isInteger(flat) ? flat : flat.toFixed(2)}`;
}

/** Short note next to the fee line in checkout: "1%" or "per order". */
export function formatBookingFeeNote() {
  return isBookingFeeFlat() ? "per order" : formatPercentLabel(getBookingFeePercent());
}

/**
 * Organiser platform fee percent points (default 5), taken from each ticket sale.
 * Reads the old PUBLIC_WITHDRAWAL_PLATFORM_FEE_PERCENT name when the new one is unset.
 */
export function getPlatformFeePercent() {
  return parsePercent(
    readEnv("PUBLIC_PLATFORM_FEE_PERCENT"),
    5
  );
}

export function getPlatformFeeRate() {
  return getPlatformFeePercent() / 100;
}

export function formatPlatformFeePercent() {
  return formatPercentLabel(getPlatformFeePercent());
}

export function calculateOrganiserPlatformFee(revenue) {
  const base = Number(revenue) || 0;
  if (base <= 0) return 0;
  return Math.round(base * getPlatformFeeRate() * 100) / 100;
}

/** Splits a sale's face value into the 5% platform fee and the organiser's share. */
export function calculateSaleSplit(faceValue) {
  const face = Math.round((Number(faceValue) || 0) * 100) / 100;
  const platformFee = calculateOrganiserPlatformFee(face);
  return { face, platformFee, organiserNet: Math.round((face - platformFee) * 100) / 100 };
}

/** Mobile money transfer fee the organiser pays on each withdrawal (default 1%). */
export function getWithdrawalMonimeFeePercent() {
  return parsePercent(readEnv("PUBLIC_WITHDRAWAL_MONIME_FEE_PERCENT"), 1);
}

export function getWithdrawalMonimeFeeRate() {
  return getWithdrawalMonimeFeePercent() / 100;
}

export function formatWithdrawalMonimeFeePercent() {
  return formatPercentLabel(getWithdrawalMonimeFeePercent());
}

/**
 * Withdrawal fee: only the mobile money transfer fee. The 5% platform fee was already taken at sale.
 * Shared by the wallet page (display) and /api/wallet/withdraw (payout).
 */
export function calculateWithdrawalFee(withdrawalAmount) {
  const amount = Math.max(0, Number(withdrawalAmount) || 0);
  const monimeFee = Math.round(amount * getWithdrawalMonimeFeeRate() * 100) / 100;
  return {
    platformFee: 0,
    monimeFee,
    totalFees: monimeFee,
    netAmountAfterPlatformFee: amount,
    netAmount: Math.max(0, Math.round((amount - monimeFee) * 100) / 100),
  };
}
