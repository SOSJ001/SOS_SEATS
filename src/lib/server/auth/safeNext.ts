/**
 * Safe post-auth redirect path (roadmap 2.1).
 * Only relative paths starting with / that are not //.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/dashboard";
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  return path;
}
