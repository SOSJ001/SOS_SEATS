import type { RequestHandler } from "./$types";
import { handleScanRequest } from "$lib/server/tickets/scan";

/** FR-23: is this QR a valid, unused ticket for the event? Read-only. */
export const POST: RequestHandler = (event) => handleScanRequest(event, false);
