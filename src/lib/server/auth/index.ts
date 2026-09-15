/**
 * Rebuild server domain: auth.
 * Privileged session/auth helpers. Do not import from client components.
 */
export {
  resolveSession,
  resolveBearerSession,
  type ResolvedSession,
} from "./session";
