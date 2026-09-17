/**
 * userSession cookie helpers (roadmap 2.1).
 * Shape must stay compatible with parseSession (user.id + user_metadata).
 */
import type { Cookies } from "@sveltejs/kit";
import { dev } from "$app/environment";

const COOKIE_NAME = "userSession";
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7;

export function cookieOptions(maxAge = DEFAULT_MAX_AGE) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: !dev,
    maxAge,
  };
}

export function maxAgeFromExpiresAt(expiresAt: number | null | undefined): number {
  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) {
    return DEFAULT_MAX_AGE;
  }
  const remaining = Math.floor(expiresAt - Date.now() / 1000);
  return remaining > 0 ? remaining : DEFAULT_MAX_AGE;
}

export function setUserSessionCookie(
  cookies: Cookies,
  user: object,
  expiresAt?: number | null
) {
  cookies.set(COOKIE_NAME, JSON.stringify(user), cookieOptions(maxAgeFromExpiresAt(expiresAt)));
}

export function clearUserSessionCookie(cookies: Cookies) {
  cookies.delete(COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: !dev,
  });
}
