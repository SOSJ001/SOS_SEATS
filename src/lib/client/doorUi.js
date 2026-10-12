import { writable } from "svelte/store";

/**
 * Live camera status for the Door shell header (roadmap 7.2).
 * Set only in the browser (onMount / camera callbacks): module stores are shared across
 * requests during server rendering.
 * @type {import("svelte/store").Writable<"idle" | "starting" | "active" | "paused" | "blocked" | "insecure">}
 */
export const doorScannerStatus = writable("idle");
