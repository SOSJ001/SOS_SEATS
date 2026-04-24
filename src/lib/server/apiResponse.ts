import { json } from "@sveltejs/kit";

type JsonInit = ConstructorParameters<typeof Response>[1];

/**
 * Consistent API envelope for SvelteKit +server routes.
 * Prefer `{ success, data?, error?, code? }` for new/updated handlers.
 */
export function jsonSuccess<T>(data: T, init?: JsonInit) {
  return json({ success: true as const, data }, { status: 200, ...init });
}

export function jsonError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return json(
    {
      success: false as const,
      error: message,
      ...(extra && typeof extra === "object" ? extra : {}),
    },
    { status }
  );
}

export type ApiSuccessBody<T> = { success: true; data: T };
export type ApiErrorBody = { success: false; error: string; code?: string };
