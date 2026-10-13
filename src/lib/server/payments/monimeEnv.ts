/**
 * Server-only Monime credentials.
 * Private env only: PUBLIC_* values are shipped to the browser, so they are never read here.
 * Do not import from client components.
 */
import { env as privateEnv } from "$env/dynamic/private";

export type MonimeCredentials = {
  apiKey: string;
  spaceId: string;
  environment: string;
};

/**
 * @param {{ preferPayoutKey?: boolean }} [opts]
 */
export function getMonimeCredentials(opts?: {
  preferPayoutKey?: boolean;
}): MonimeCredentials | null {
  const preferPayout = opts?.preferPayoutKey === true;

  const apiKey = preferPayout
    ? privateEnv.MONIME_PAYOUT_API_KEY || privateEnv.MONIME_API_KEY
    : privateEnv.MONIME_API_KEY;

  const spaceId = privateEnv.MONIME_SPACE_ID;

  const environment = privateEnv.MONIME_ENVIRONMENT || "live";

  if (!apiKey || !spaceId) {
    return null;
  }

  return { apiKey, spaceId, environment };
}

/**
 * Private webhook signing secret (roadmap 5.4). No PUBLIC_* fallback.
 */
export function getMonimeWebhookSecret(): string | null {
  const secret = privateEnv.MONIME_WEBHOOK_SECRET;
  if (typeof secret !== "string" || secret.length < 32) {
    return null;
  }
  return secret;
}
