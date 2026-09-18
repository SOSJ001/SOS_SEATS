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

export async function walletDataPost(body: Record<string, any>) {
  const res = await fetch("/api/wallet/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function ordersFulfill(body: Record<string, any>) {
  const res = await fetch("/api/orders/fulfill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
