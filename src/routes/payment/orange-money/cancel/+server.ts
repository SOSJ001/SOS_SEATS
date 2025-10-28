import { redirect, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/**
 * Handle cancel redirect from Monime
 * Monime sends a POST request via form submission, which browsers block cross-site.
 * We'll return an HTML page that auto-redirects instead of using SvelteKit's redirect
 */
export const POST: RequestHandler = async ({ request, url }) => {
  console.log("🔍 Cancel handler POST called - URL:", url.toString());
  console.log("🔍 Cancel handler - Referer:", request.headers.get("referer"));

  // Extract event ID from the referrer or request body
  let body = null;
  try {
    body = await request.formData();
  } catch (e) {
    // If formData() fails, try JSON
    try {
      body = await request.json();
    } catch (e2) {
      // Ignore
    }
  }

  const referer = request.headers.get("referer");

  // Try to get event ID from form data first
  let eventId: string | null = null;
  if (body instanceof FormData) {
    eventId =
      body.get("event_id")?.toString() || body.get("e")?.toString() || null;
  } else if (body && typeof body === "object") {
    eventId = (body as any).event_id || (body as any).e || null;
  }

  // If not in form data, try to extract from referer URL
  if (!eventId && referer) {
    try {
      const refererUrl = new URL(referer);
      const pathParts = refererUrl.pathname.split("/");
      const eventDetailsIndex = pathParts.indexOf("eventDetails");
      if (eventDetailsIndex !== -1 && pathParts[eventDetailsIndex + 1]) {
        eventId = pathParts[eventDetailsIndex + 1];
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }

  // If still no event ID, try query parameters
  if (!eventId) {
    eventId =
      url.searchParams.get("e") || url.searchParams.get("event_id") || null;
  }

  // Build redirect URL
  const redirectUrl = eventId
    ? `/marketplace/eventDetails/${eventId}?payment=cancelled`
    : "/marketplace?payment=cancelled";

  // Return HTML page that auto-redirects (works with cross-site POST)
  return new Response(
    `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <script>
    window.location.href = "${redirectUrl}";
  </script>
</head>
<body>
  <p>Redirecting... <a href="${redirectUrl}">Click here if not redirected</a></p>
</body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
};

/**
 * Also handle GET requests (in case Monime uses GET for cancel)
 */
export const GET: RequestHandler = async ({ url }) => {
  const eventId =
    url.searchParams.get("e") || url.searchParams.get("event_id") || "";

  if (eventId) {
    throw redirect(
      302,
      `/marketplace/eventDetails/${eventId}?payment=cancelled`
    );
  }

  throw redirect(302, "/marketplace?payment=cancelled");
};
