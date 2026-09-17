import { signOutbtnFunction } from "$lib/supabase";

/** Same logout path as legacy DashboardSidebar (roadmap 1.4). */
export async function authedLogout() {
  await signOutbtnFunction();
  await fetch("/logoutApi", {
    method: "POST",
    body: JSON.stringify({}),
    headers: { "Content-Type": "application/json" },
  });
  window.location.href = "/";
}

export function initialsFromName(name) {
  const parts = String(name || "User")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
