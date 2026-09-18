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
export { resolveLinkedIdentity } from "./linkedIdentity";
export { getAnonSupabase } from "./anon";
export { loginWithPassword, signUpWithPassword, AUTH_SERVICE_UNREACHABLE } from "./password";
export {
  normalizeSlPhone,
  toSyntheticEmail,
  isPhoneSyntheticEmail,
  loginWithPhone,
  signUpWithPhone,
  PHONE_SYNTHETIC_DOMAIN,
} from "./phone";
export {
  setUserSessionCookie,
  clearUserSessionCookie,
  cookieOptions,
} from "./cookies";
export { safeNextPath } from "./safeNext";
