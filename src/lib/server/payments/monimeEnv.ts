/**
 * Server-only Monime credentials (roadmap 5.2 / 0.3 API-key slice).
 * Prefer private env; fall back to PUBLIC_* so existing .env keeps working.
 * Do not import from client components.
 */
import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";

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
    ? privateEnv.MONIME_PAYOUT_API_KEY ||
      publicEnv.PUBLIC_MONIME_PAYOUT_API_KEY ||
      privateEnv.MONIME_API_KEY ||
      publicEnv.PUBLIC_MONIME_API_KEY
    : privateEnv.MONIME_API_KEY || publicEnv.PUBLIC_MONIME_API_KEY;

  const spaceId =
    privateEnv.MONIME_SPACE_ID || publicEnv.PUBLIC_MONIME_SPACE_ID;

  const environment =
    privateEnv.MONIME_ENVIRONMENT ||
    publicEnv.PUBLIC_MONIME_ENVIRONMENT ||
    "live";

  if (!apiKey || !spaceId) {
    return null;
  }

  return { apiKey, spaceId, environment };
}
