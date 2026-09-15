import type { RequestEvent } from "@sveltejs/kit";
import { parseSession } from "$lib/sessionUtils.js";

export type ResolvedSession = {
  userId: string | null;
  userName: string | null;
  sessionType: string | null;
  walletAddress: string | null;
};

/**
 * Bearer product-session resolve. Filled in roadmap 2.1.
 * Incoming user Authorization only - not Monime outbound API keys.
 */
export function resolveBearerSession(_token: string): ResolvedSession | null {
  return null;
}

/**
 * Resolve Cookie (primary) or Bearer (stub) into the same product session shape.
 */
export function resolveSession(event: RequestEvent): ResolvedSession {
  // as-built sessionUtils is JS with loose Object types
  const parsed = parseSession(event.cookies) as {
    user_Id: string | null;
    userName: string | null;
    sessionType: string | null;
    walletAddress: string | null;
  };
  const { user_Id, userName, sessionType, walletAddress } = parsed;

  if (user_Id) {
    return {
      userId: user_Id,
      userName: userName ?? null,
      sessionType: sessionType ?? null,
      walletAddress: walletAddress ?? null,
    };
  }

  const authHeader = event.request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) {
      const bearer = resolveBearerSession(token);
      if (bearer) return bearer;
    }
  }

  return {
    userId: null,
    userName: null,
    sessionType: null,
    walletAddress: null,
  };
}
