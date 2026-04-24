/**
 * Monime credentials: server-only. Never import this module from client code.
 * Set MONIME_* in .env (not PUBLIC_). Rotate keys that were ever exposed as PUBLIC_MONIME_*.
 */
import { env } from "$env/dynamic/private";

/**
 * @returns {{ apiKey: string | undefined, payoutApiKey: string | undefined, spaceId: string | undefined, environment: string | undefined }}
 */
export function getMonimePrivateEnv() {
  return {
    apiKey: env.MONIME_API_KEY,
    payoutApiKey: env.MONIME_PAYOUT_API_KEY,
    spaceId: env.MONIME_SPACE_ID,
    environment: env.MONIME_ENVIRONMENT,
  };
}

/**
 * @returns {{ apiKey: string | undefined, spaceId: string | undefined, environment: string }}
 */
export function getMonimePaymentApiKeys() {
  const e = getMonimePrivateEnv();
  return {
    apiKey: e.apiKey,
    spaceId: e.spaceId,
    environment: e.environment || "live",
  };
}

/**
 * Payouts may use a separate key; falls back to payment API key.
 * @returns {{ apiKey: string | undefined, spaceId: string | undefined, environment: string }}
 */
export function getMonimePayoutApiKeys() {
  const e = getMonimePrivateEnv();
  return {
    apiKey: e.payoutApiKey || e.apiKey,
    spaceId: e.spaceId,
    environment: e.environment || "live",
  };
}
