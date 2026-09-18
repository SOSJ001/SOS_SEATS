/**
 * Roadmap 2.4: honor web3_users.linked_auth_user_id (email Auth survivor).
 * Fail soft: missing service role, query errors, or no link leave session as parsed.
 */
import { getServerSupabase } from "$lib/server/db";

export type LinkedSessionInput = {
  userId: string | null;
  userName: string | null;
  sessionType: string | null;
  walletAddress: string | null;
};

export type LinkedSessionResult = LinkedSessionInput & {
  web3UserId: string | null;
  linkedWalletAddress: string | null;
};

/**
 * Enrich a cookie/bearer-parsed session with operator link data.
 */
export async function resolveLinkedIdentity(
  session: LinkedSessionInput
): Promise<LinkedSessionResult> {
  const base: LinkedSessionResult = {
    ...session,
    web3UserId: null,
    linkedWalletAddress: null,
  };

  if (!session.userId || !session.sessionType) {
    return base;
  }

  if (session.sessionType === "phone") {
    return base;
  }

  let db;
  try {
    db = getServerSupabase();
  } catch {
    return base;
  }

  try {
    if (session.sessionType === "web3") {
      const { data, error } = await db
        .from("web3_users")
        .select("id, linked_auth_user_id, wallet_address")
        .eq("id", session.userId)
        .maybeSingle();

      if (error || !data) {
        return { ...base, web3UserId: session.userId };
      }

      const linked = data.linked_auth_user_id as string | null;
      if (linked) {
        return {
          ...base,
          userId: linked,
          web3UserId: data.id as string,
          walletAddress:
            (data.wallet_address as string | null) ?? session.walletAddress,
        };
      }

      return { ...base, web3UserId: data.id as string };
    }

    if (session.sessionType === "traditional") {
      const { data, error } = await db
        .from("web3_users")
        .select("wallet_address")
        .eq("linked_auth_user_id", session.userId)
        .limit(1)
        .maybeSingle();

      if (error || !data?.wallet_address) {
        return base;
      }

      return {
        ...base,
        linkedWalletAddress: data.wallet_address as string,
      };
    }
  } catch {
    return base;
  }

  return base;
}
