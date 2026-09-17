import type { RequestEvent } from "@sveltejs/kit";
import { parseSession } from "$lib/sessionUtils.js";
import { getAnonSupabase } from "./anon";

export type ResolvedSession = {
  userId: string | null;
  userName: string | null;
  sessionType: string | null;
  walletAddress: string | null;
};

/**
 * Bearer product-session resolve (roadmap 2.1).
 * Incoming user Authorization only - not Monime outbound API keys.
 */
export async function resolveBearerSession(
  token: string
): Promise<ResolvedSession | null> {
  try {
    const supabase = getAnonSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;

    const user = data.user;
    const meta = user.user_metadata ?? {};
    return {
      userId: user.id,
      userName: (meta.userName || meta.name || null) as string | null,
      sessionType: "traditional",
      walletAddress: null,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve Cookie (primary) or Bearer into the same product session shape.
 */
export async function resolveSession(
  event: RequestEvent
): Promise<ResolvedSession> {
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
      const bearer = await resolveBearerSession(token);
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
