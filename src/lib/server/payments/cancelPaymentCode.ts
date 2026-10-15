/**
 * Cancel an unused Monime payment code. Monime refuses codes that were already
 * paid or have ended, which callers treat as "not cancelled".
 * Do not import from client components.
 */
import { getMonimeCredentials } from "./monimeEnv";

export type CancelPaymentCodeResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; status: number };

export async function cancelMonimePaymentCode(
  codeId: string
): Promise<CancelPaymentCodeResult> {
  const creds = getMonimeCredentials();
  if (!creds) {
    return { ok: false, error: "Monime API credentials not configured", status: 500 };
  }

  const response = await fetch(
    `https://api.monime.io/v1/payment-codes/${encodeURIComponent(codeId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        "Content-Type": "application/json",
        "Monime-Space-Id": creds.spaceId,
        "Monime-Version": "caph.2025-08-23",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      ok: false,
      error: errorData?.error?.message || errorData?.message || "Failed to cancel payment code",
      status: response.status,
    };
  }

  const data = await response.json().catch(() => ({}));
  return { ok: true, data };
}
