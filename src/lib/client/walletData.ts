/**
 * Browser helper for wallet_transactions / orders after 3.2 RLS harden.
 * Routes through Kit /api/wallet/data (service role + session authz).
 */
export async function walletDataGet(
  action: string,
  params: Record<string, string | number | undefined> = {}
) {
  const qs = new URLSearchParams({ action });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  const res = await fetch(`/api/wallet/data?${qs.toString()}`);
  return res.json();
}

/** Pay out the chosen amount (whole available balance if none) to a mobile money number. */
export async function requestWithdrawal(body: {
  amount?: number;
  phone: string;
  provider: "orange_money" | "afrimoney";
}) {
  const res = await fetch("/api/wallet/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Refresh the signed-in organiser's pending payouts from Monime. */
export async function syncPayouts() {
  const res = await fetch("/api/wallet/sync-payouts", { method: "POST" });
  return res.json();
}
