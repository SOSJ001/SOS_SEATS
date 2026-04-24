import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/public";

/**
 * JSON-RPC `getSlot` against `PUBLIC_SOLANA_RPC_URL` (or devnet default).
 */
export const GET: RequestHandler = async () => {
  const rpcUrl =
    env.PUBLIC_SOLANA_RPC_URL?.trim() || "https://api.devnet.solana.com";

  const t0 = Date.now();
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 8000);
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSlot",
      }),
      signal: ac.signal,
    });
    const latencyMs = Date.now() - t0;
    const payload = await res.json().catch(() => null);
    const slot =
      payload &&
      typeof payload === "object" &&
      "result" in payload &&
      typeof (payload as { result?: unknown }).result === "number"
        ? (payload as { result: number }).result
        : null;
    const rpcError =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      (payload as { error?: unknown }).error;
    const ok = res.ok && slot !== null && !rpcError;
    return json({
      ok,
      latencyMs,
      status: res.status,
      slot,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    const latencyMs = Date.now() - t0;
    return json(
      {
        ok: false,
        latencyMs,
        code: "SOLANA_RPC_UNREACHABLE",
        checkedAt: new Date().toISOString(),
      },
      { status: 503 }
    );
  } finally {
    clearTimeout(to);
  }
};
