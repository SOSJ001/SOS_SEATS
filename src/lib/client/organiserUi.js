import { writable } from "svelte/store";

/** Optional override for OrganiserShell topbar title (event hub desktop + mobile). */
export const organiserTopbarTitle = writable(/** @type {string | null} */ (null));
