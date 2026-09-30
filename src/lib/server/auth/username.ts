/**
 * Roadmap 2.7: global username on web3_users for email/phone Auth accounts.
 */
import { getServerSupabase } from "$lib/server/db";
import { normalizeSlPhone, toSyntheticEmail } from "./phone";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export type UsernameOk = { ok: true; username: string };
export type UsernameBad = { ok: false; error: string };

export function normalizeUsername(input: string): UsernameOk | UsernameBad {
  if (typeof input !== "string" || !input.trim()) {
    return { ok: false, error: "Username is required" };
  }
  const username = input.trim().toLowerCase();
  if (username.length < 3) {
    return { ok: false, error: "Username must be at least 3 characters" };
  }
  if (username.length > 20) {
    return { ok: false, error: "Username must be at most 20 characters" };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error:
        "Username can only contain lowercase letters, numbers, and underscores",
    };
  }
  return { ok: true, username };
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("web3_users")
    .select("id")
    .eq("username", username)
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(error.message || "Could not check username");
  }
  return !!data;
}

export type ProvisionResult =
  | { ok: true }
  | { ok: false; error: string; conflict?: boolean };

/**
 * Insert auth-linked username row. Caller must have already created Auth user.
 */
export async function provisionAuthUsername(opts: {
  authUserId: string;
  username: string;
}): Promise<ProvisionResult> {
  const usernameNorm = normalizeUsername(opts.username);
  if (!usernameNorm.ok) {
    return { ok: false, error: usernameNorm.error };
  }
  const { username } = usernameNorm;
  const db = getServerSupabase();

  const { data: existing } = await db
    .from("web3_users")
    .select("id, username")
    .eq("linked_auth_user_id", opts.authUserId)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    if (existing.username === username) {
      return { ok: true };
    }
    if (!existing.username) {
      const { error: updErr } = await db
        .from("web3_users")
        .update({ username })
        .eq("id", existing.id);
      if (updErr) {
        if (updErr.code === "23505") {
          return {
            ok: false,
            error: "Username already taken",
            conflict: true,
          };
        }
        return { ok: false, error: updErr.message };
      }
      return { ok: true };
    }
    return { ok: true };
  }

  const taken = await isUsernameTaken(username);
  if (taken) {
    return { ok: false, error: "Username already taken", conflict: true };
  }

  const { error } = await db.from("web3_users").insert({
    username,
    linked_auth_user_id: opts.authUserId,
    wallet_address: null,
    is_active: true,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Username already taken", conflict: true };
    }
    console.error("[2.7] provisionAuthUsername insert failed", {
      authUserId: opts.authUserId,
      username,
      message: error.message,
    });
    return {
      ok: false,
      error:
        "Account created but username could not be saved. Contact support.",
    };
  }

  return { ok: true };
}

/**
 * After login: if metadata has userName but no web3_users row, provision it.
 */
export async function ensureAuthUsernameProvisioned(opts: {
  authUserId: string;
  userName: string | null | undefined;
}): Promise<void> {
  if (!opts.userName?.trim()) return;
  const norm = normalizeUsername(opts.userName);
  if (!norm.ok) return;

  try {
    const db = getServerSupabase();
    const { data } = await db
      .from("web3_users")
      .select("id")
      .eq("linked_auth_user_id", opts.authUserId)
      .limit(1)
      .maybeSingle();
    if (data?.id) return;

    await provisionAuthUsername({
      authUserId: opts.authUserId,
      username: norm.username,
    });
  } catch (err) {
    console.error("[2.7] ensureAuthUsernameProvisioned failed", err);
  }
}

/**
 * Registry username for an Auth account, or null if none or on lookup error.
 */
export async function getRegistryUsername(
  authUserId: string,
): Promise<string | null> {
  if (!authUserId) return null;
  try {
    const db = getServerSupabase();
    const { data, error } = await db
      .from("web3_users")
      .select("username")
      .eq("linked_auth_user_id", authUserId)
      .not("username", "is", null)
      .limit(1)
      .maybeSingle();
    if (error || !data?.username) return null;
    return data.username as string;
  } catch {
    return null;
  }
}

/**
 * Copy of the Auth user with user_metadata.userName set from the registry,
 * so the session name matches the sign-in username. Never throws.
 */
export async function withRegistryUserName<
  T extends { id: string; user_metadata?: Record<string, unknown> },
>(user: T): Promise<T> {
  const username = await getRegistryUsername(user.id);
  if (!username) return user;
  return {
    ...user,
    user_metadata: { ...(user.user_metadata ?? {}), userName: username },
  };
}

/**
 * Resolve login identifier to Auth email (real or phone synthetic).
 * Email-shaped (@) → as-is. Else username → linked Auth user email.
 */
export async function resolveLoginEmail(
  identifier: string,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const raw = typeof identifier === "string" ? identifier.trim() : "";
  if (!raw) {
    return { ok: false, error: "Username or email is required" };
  }

  if (raw.includes("@")) {
    return { ok: true, email: raw.toLowerCase() };
  }

  const norm = normalizeUsername(raw);
  if (!norm.ok) {
    return { ok: false, error: "Invalid username or email" };
  }

  const db = getServerSupabase();
  const { data: row, error } = await db
    .from("web3_users")
    .select("linked_auth_user_id")
    .eq("username", norm.username)
    .limit(1)
    .maybeSingle();

  if (error || !row?.linked_auth_user_id) {
    return { ok: false, error: "Invalid username or email" };
  }

  const { data: userData, error: userErr } = await db.auth.admin.getUserById(
    row.linked_auth_user_id as string,
  );

  if (userErr || !userData?.user?.email) {
    return { ok: false, error: "Invalid username or email" };
  }

  return { ok: true, email: userData.user.email };
}

/**
 * Phone login identifier: phone-shaped → synthetic email; else username resolve.
 */
export async function resolvePhoneLoginEmail(
  identifier: string,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const raw = typeof identifier === "string" ? identifier.trim() : "";
  if (!raw) {
    return { ok: false, error: "Username or phone is required" };
  }

  if (raw.includes("@")) {
    return { ok: false, error: "Invalid username or phone" };
  }

  const asPhone = normalizeSlPhone(raw);
  if (asPhone.ok) {
    return { ok: true, email: toSyntheticEmail(asPhone.e164) };
  }

  const resolved = await resolveLoginEmail(raw);
  if (!resolved.ok) {
    return { ok: false, error: "Invalid username or phone" };
  }
  return resolved;
}
