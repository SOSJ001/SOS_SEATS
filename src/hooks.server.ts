import { redirect, type Handle } from "@sveltejs/kit";
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

  return resolve(event);
};
