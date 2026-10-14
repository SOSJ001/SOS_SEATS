/**
 * userSession cookie helpers (roadmap 2.1 / 3.5).
 * The cookie is base64url(payload).base64url(HMAC-SHA256(payload, SESSION_SECRET)),
 * so the server can trust it. Unsigned or tampered cookies read as signed out.
 */
import type { Cookies } from "@sveltejs/kit";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";

const COOKIE_NAME = "userSession";
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7;

/** Fields parseSession needs; mirrors the Supabase user shape it used to read. */
export type UserSessionPayload = {
  id: string;
  email: string | null;
  user_metadata: {
    userName?: string | null;
    name?: string | null;
    sessionType?: string | null;
  };
  exp: number;
};

let devSecret: string | null = null;

function sessionSecret(): string {
  const secret = env.SESSION_SECRET;
  if (typeof secret === "string" && secret.length >= 32) return secret;
  if (dev) {
    // Local only: sessions reset when the dev server restarts.
    devSecret ??= randomBytes(32).toString("hex");
    return devSecret;
  }
  throw new Error("SESSION_SECRET is missing or shorter than 32 characters");
}

function sign(body: string): string {
  return createHmac("sha256", sessionSecret()).update(body).digest("base64url");
}

export function cookieOptions(maxAge = DEFAULT_MAX_AGE) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: !dev,
    maxAge,
  };
}

export function setUserSessionCookie(
  cookies: Cookies,
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, any> | null;
  }
) {
  const maxAge = DEFAULT_MAX_AGE;
  const meta = user.user_metadata || {};
  const payload: UserSessionPayload = {
    id: user.id,
    email: user.email ?? null,
    user_metadata: {
      userName: meta.userName ?? null,
      name: meta.name ?? null,
      sessionType: meta.sessionType ?? null,
    },
    exp: Math.floor(Date.now() / 1000) + maxAge,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  cookies.set(COOKIE_NAME, `${body}.${sign(body)}`, cookieOptions(maxAge));
}

/** The verified cookie payload, or null if missing, unsigned, tampered or expired. */
export function readUserSessionCookie(cookies: Cookies): UserSessionPayload | null {
  const raw = cookies.get(COOKIE_NAME);
  if (!raw) return null;

  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = raw.slice(0, dot);
  const given = Buffer.from(raw.slice(dot + 1), "base64url");

  let expected: Buffer;
  try {
    expected = Buffer.from(sign(body), "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload?.id || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload as UserSessionPayload;
  } catch {
    return null;
  }
}

export function clearUserSessionCookie(cookies: Cookies) {
  cookies.delete(COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: !dev,
  });
}
