import type { RequestEvent } from "@sveltejs/kit";
import { parseSession } from "$lib/sessionUtils.js";
import { getAnonSupabase } from "./anon";
import { resolveLinkedIdentity } from "./linkedIdentity";

export type ResolvedSession = {
  userId: string | null;
  userName: string | null;
  sessionType: string | null;
  walletAddress: string | null;
  /** Original web3_users.id when sessionType is web3 (before survivor remap). */
  web3UserId: string | null;
  /** Linked Solana address when traditional email has an operator-linked wallet. */
  linkedWalletAddress: string | null;
};

function emptySession(): ResolvedSession {
  return {
    userId: null,
    userName: null,
    sessionType: null,
    walletAddress: null,
    web3UserId: null,
    linkedWalletAddress: null,
  };
}

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
    const email = typeof user.email === "string" ? user.email : "";
    const sessionType =
      meta.sessionType === "phone" ||
      email.toLowerCase().endsWith("@phone.sosseats.internal")
        ? "phone"
        : "traditional";
    const base = {
      userId: user.id,
      userName: (meta.userName || meta.name || null) as string | null,
      sessionType,
      walletAddress: null as string | null,
    };
    return resolveLinkedIdentity(base);
  } catch {
    return null;
  }
}

/**
 * Resolve Cookie (primary) or Bearer into the same product session shape.
 * Roadmap 2.4: applies linked_auth_user_id enrich after parse.
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
    return resolveLinkedIdentity({
      userId: user_Id,
      userName: userName ?? null,
      sessionType: sessionType ?? null,
      walletAddress: walletAddress ?? null,
    });
  }

  const authHeader = event.request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) {
      const bearer = await resolveBearerSession(token);
      if (bearer) return bearer;
    }
  }

  return emptySession();
}
