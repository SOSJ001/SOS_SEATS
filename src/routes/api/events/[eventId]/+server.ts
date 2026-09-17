/**
 * Rebuild path (roadmap 0.6). Re-exports as-built updateEventApi handler.
 * Param name eventId must match as-built params.eventId.
 * Callers may keep using /updateEventApi/[eventId] for now.
 */
export { PUT } from "../../../updateEventApi/[eventId]/+server.js";
