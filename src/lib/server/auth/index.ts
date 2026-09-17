/**
 * Rebuild server domain: auth (roadmap 1.2 / 2.1).
 * Owns: session resolve, anon password grant, cookie helpers.
 * Do not import from client components.
 */
export {
  resolveSession,
  resolveBearerSession,
  type ResolvedSession,
} from "./session";
export { getAnonSupabase } from "./anon";
export { loginWithPassword, signUpWithPassword } from "./password";
export {
  setUserSessionCookie,
  clearUserSessionCookie,
  cookieOptions,
} from "./cookies";
export { safeNextPath } from "./safeNext";
