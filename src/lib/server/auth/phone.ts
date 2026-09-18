/**
 * Phone+password auth helpers (roadmap 2.2 / FR-33).
 * Maps E.164 +232XXXXXXXX → synthetic email on auth.users.
 */
import { getAnonSupabase } from "./anon";
import { AUTH_SERVICE_UNREACHABLE } from "./password";

export const PHONE_SYNTHETIC_DOMAIN = "phone.sosseats.internal";

const E164_SL = /^\+232\d{8}$/;

function catchAuthThrow(err: unknown) {
  const message =
    err instanceof Error && err.message.includes("Missing env")
      ? err.message
      : AUTH_SERVICE_UNREACHABLE;
  return {
    data: { user: null, session: null },
    error: { message },
  };
}

/**
 * Normalize local or full SL numbers to E.164 `+232` + 8 digits.
 * Strips spaces; strips a leading national `0` (Monime payout pattern).
 */
export function normalizeSlPhone(input: string):
  | { ok: true; e164: string }
  | { ok: false; error: string } {
  if (typeof input !== "string" || !input.trim()) {
    return { ok: false, error: "Phone number is required" };
  }

  let digits = input.trim().replace(/[\s\-()]/g, "");

  if (digits.startsWith("+")) {
    if (digits.startsWith("+2320") && digits.length === 13) {
      digits = digits.replace("+2320", "+232");
    }
  } else if (digits.startsWith("232")) {
    digits = `+${digits}`;
    if (digits.startsWith("+2320") && digits.length === 13) {
      digits = digits.replace("+2320", "+232");
    }
  } else {
    if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }
    digits = `+232${digits}`;
  }

  if (!E164_SL.test(digits)) {
    return {
      ok: false,
      error:
        "Invalid phone number. Use a Sierra Leone number: 8 digits after +232.",
    };
  }

  return { ok: true, e164: digits };
}

/** Local part without `+`: `232XXXXXXXX@phone.sosseats.internal`. */
export function toSyntheticEmail(e164: string): string {
  const local = e164.startsWith("+") ? e164.slice(1) : e164;
  return `${local}@${PHONE_SYNTHETIC_DOMAIN}`;
}

export function isPhoneSyntheticEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  return email.toLowerCase().endsWith(`@${PHONE_SYNTHETIC_DOMAIN}`);
}

export async function loginWithPhone(e164: string, password: string) {
  try {
    const supabase = getAnonSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: toSyntheticEmail(e164),
      password,
    });
    return { data, error };
  } catch (err) {
    return catchAuthThrow(err);
  }
}

export async function signUpWithPhone(
  e164: string,
  password: string,
  name: string,
) {
  try {
    const supabase = getAnonSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: toSyntheticEmail(e164),
      password,
      options: {
        data: {
          name,
          phone: e164,
          sessionType: "phone",
        },
      },
    });
    return { data, error };
  } catch (err) {
    return catchAuthThrow(err);
  }
}
