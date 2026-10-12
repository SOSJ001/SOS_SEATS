import type { RequestHandler } from "./$types";
import { handleScanRequest } from "$lib/server/tickets/scan";

/** FR-24: check in a valid, unused ticket once and record the time. */
export const POST: RequestHandler = (event) => handleScanRequest(event, true);
