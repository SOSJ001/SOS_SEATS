import { redirect, type Handle } from "@sveltejs/kit";
import { resolveSession } from "$lib/server/auth";

/**
 * Rebuild session door (roadmap 0.5).
 * Cookie session into locals; Bearer stub for 2.1; gate /dashboard only.
 */
export const handle: Handle = async ({ event, resolve }) => {
  const session = resolveSession(event);

  event.locals.userId = session.userId;
  event.locals.userName = session.userName;
  event.locals.sessionType = session.sessionType;
  event.locals.walletAddress = session.walletAddress;

  if (
    event.url.pathname.startsWith("/dashboard") &&
    !event.locals.userId
  ) {
    throw redirect(302, "/");
  }

  return resolve(event);
};
