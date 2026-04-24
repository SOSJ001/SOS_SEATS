import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/**
 * Lightweight reachability check for Monime API edge (no secrets in response).
 */
export const GET: RequestHandler = async () => {
  const t0 = Date.now();
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 8000);
  try {
    const res = await fetch("https://api.monime.io/", {
      method: "HEAD",
      signal: ac.signal,
    });
    const latencyMs = Date.now() - t0;
    const ok = res.status < 500;
    return json({
      ok,
      latencyMs,
      status: res.status,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    const latencyMs = Date.now() - t0;
    return json(
      {
        ok: false,
        latencyMs,
        status: 0,
        code: "MONIME_UNREACHABLE",
        checkedAt: new Date().toISOString(),
      },
      { status: 503 }
    );
  } finally {
    clearTimeout(to);
  }
};
