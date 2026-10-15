import { writable } from "svelte/store";

/** Visibility of the draft being edited, so wizard chrome can hide the Ticket Types step. */
export const draftVisibility = writable("public");

/** Private events have no sellable ticket types, so step 2 is skipped. */
export const TICKET_TYPES_STEP = 2;

/**
 * @template {{ id: number }} T
 * @param {T[]} baseSteps
 * @param {boolean} isPrivate
 * @returns {T[]}
 */
export function wizardSteps(baseSteps, isPrivate) {
  return isPrivate
    ? baseSteps.filter((s) => s.id !== TICKET_TYPES_STEP)
    : baseSteps;
}

/**
 * Display number for a step id once step 2 may be skipped.
 * @param {number} id
 * @param {boolean} isPrivate
 */
export function stepNumber(id, isPrivate) {
  return isPrivate && id > TICKET_TYPES_STEP ? id - 1 : id;
}

/** @param {{ event_visibility?: unknown } | null | undefined} draft */
export function draftIsPrivate(draft) {
  return String(draft?.event_visibility || "public").toLowerCase() === "private";
}
