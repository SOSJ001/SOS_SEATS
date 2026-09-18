/**
 * Roadmap 3.1: wallet directory lookups against plural web3_users.
 * Uses service-role client (Kit cookie sessions are not auth.uid()).
 * Do not import from client components.
 */
import { getServerSupabase } from "$lib/server/db";

export type WalletDirectoryRow = {
  id: string;
  username: string | null;
  publicKey: string;
  wallet_address: string;
};

/**
 * Resolve one user's public wallet by web3 id or linked auth user id.
 */
export async function getUserPublicKey(
  userId: string | null | undefined
): Promise<{ data: WalletDirectoryRow[]; error: { message: string } | null }> {
  if (!userId) {
    return { data: [], error: null };
  }

  try {
    const db = getServerSupabase();
    const { data, error } = await db
      .from("web3_users")
      .select("id, username, wallet_address")
      .or(`id.eq.${userId},linked_auth_user_id.eq.${userId}`)
      .limit(1);

    if (error) {
      return { data: [], error: { message: error.message } };
    }

    const rows = (data || [])
      .filter((row) => row.wallet_address)
      .map((row) => ({
        id: row.id as string,
        username: (row.username as string | null) ?? null,
        wallet_address: row.wallet_address as string,
        publicKey: row.wallet_address as string,
      }));

    return { data: rows, error: null };
  } catch (err) {
    return {
      data: [],
      error: {
        message: err instanceof Error ? err.message : "wallet directory failed",
      },
    };
  }
}

/**
 * List active web3 users for username → publicKey directory search.
 */
export async function listWalletDirectory(): Promise<{
  data: WalletDirectoryRow[];
  error: { message: string } | null;
}> {
  try {
    const db = getServerSupabase();
    const { data, error } = await db
      .from("web3_users")
      .select("id, username, wallet_address")
      .eq("is_active", true);

    if (error) {
      return { data: [], error: { message: error.message } };
    }

    const rows = (data || [])
      .filter((row) => row.wallet_address)
      .map((row) => ({
        id: row.id as string,
        username: (row.username as string | null) ?? null,
        wallet_address: row.wallet_address as string,
        publicKey: row.wallet_address as string,
      }));

    return { data: rows, error: null };
  } catch (err) {
    return {
      data: [],
      error: {
        message: err instanceof Error ? err.message : "wallet directory failed",
      },
    };
  }
}
