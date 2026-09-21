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

export function calculateBookingFee(baseTotal) {
  const base = Number(baseTotal) || 0;
  if (base <= 0) return 0;
  return Math.round(base * getBookingFeeRate() * 100) / 100;
}

export function formatBookingFeePercent() {
  return formatPercentLabel(getBookingFeePercent());
}

/** Organiser platform fee percent points (default 5). Shared by landing, hub overview, withdrawal. */
export function getPlatformFeePercent() {
  return parsePercent(readEnv("PUBLIC_WITHDRAWAL_PLATFORM_FEE_PERCENT"), 5);
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

/** Monime processing fee on withdrawals (default 1%). */
export function getWithdrawalMonimeFeePercent() {
  return parsePercent(readEnv("PUBLIC_WITHDRAWAL_MONIME_FEE_PERCENT"), 1);
}

export function getWithdrawalMonimeFeeRate() {
  return getWithdrawalMonimeFeePercent() / 100;
}

export function formatWithdrawalMonimeFeePercent() {
  return formatPercentLabel(getWithdrawalMonimeFeePercent());
}

export function getWithdrawalFeeMin() {
  return parsePercent(readEnv("PUBLIC_WITHDRAWAL_FEE_MIN"), 0);
}

export function getWithdrawalFeeMax() {
  return parsePercent(readEnv("PUBLIC_WITHDRAWAL_FEE_MAX"), 0);
}
