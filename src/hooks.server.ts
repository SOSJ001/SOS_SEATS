import { json, redirect, type Handle, type RequestEvent } from "@sveltejs/kit";
import { resolveSession } from "$lib/server/auth";

const publicPaths = ['/api/monime/webhook'];
/**
 * Rebuild session door (roadmap 0.5 / 2.1).
 * Cookie primary; Bearer via getUser; gate /dashboard → /sign-in.
 */
export const handle: Handle = async ({ event, resolve }) => {
  //resolve webhook requests 401 from monime
  if (publicPaths.includes(event.url.pathname)) {
    return resolve(event);
  }

  if (event.url.pathname === "/dev-sw.js") {
    return new Response(null, { status: 404 });
  }

  const session = await resolveSession(event);

  event.locals.userId = session.userId;
  event.locals.userName = session.userName;
  event.locals.sessionType = session.sessionType;
  event.locals.walletAddress = session.walletAddress;
  event.locals.web3UserId = session.web3UserId;
  event.locals.linkedWalletAddress = session.linkedWalletAddress;

  if (event.url.pathname.startsWith("/dashboard") && !event.locals.userId) {
    const next = encodeURIComponent(event.url.pathname + event.url.search);
    throw redirect(302, `/sign-in?next=${next}`);
  }

  const gated = gateStaff(event);
  if (gated) return gated;

  return resolve(event);
};

const STAFF_HOME = "/dashboard/staff";

function isStaffRoute(routeId: string | null): boolean {
  return (
    routeId === "/(authed)/dashboard/staff" ||
    !!routeId?.startsWith("/(authed)/dashboard/staff/")
  );
}

function isStaffAllowedApi(pathname: string): boolean {
  return (
    pathname.startsWith("/api/scanner/") ||
    pathname === "/api/auth/logout" ||
    pathname.startsWith("/api/auth/staff/")
  );
}

/**
 * Roadmap 7.3: staff sessions only reach their assigned events and the scanner;
 * everyone else stays out of the staff landing.
 */
function gateStaff(event: RequestEvent): Response | null {
  const { pathname } = event.url;
  const routeId = event.route.id;
  const isStaff = event.locals.sessionType === "staff";

  if (pathname.startsWith("/api/")) {
    if (isStaff && !isStaffAllowedApi(pathname)) {
      return json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    return null;
  }

  if (!pathname.startsWith("/dashboard")) return null;

  if (isStaff) {
    const allowed =
      isStaffRoute(routeId) ||
      routeId === "/(authed)/dashboard/scanner/[eventId]";
    if (!allowed) throw redirect(302, STAFF_HOME);
  } else if (isStaffRoute(routeId)) {
    throw redirect(302, "/dashboard");
  }

  return null;
}
