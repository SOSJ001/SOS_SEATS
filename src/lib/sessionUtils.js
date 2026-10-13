/**
 * Map a verified userSession payload to the product session fields.
 * The payload must come from readUserSessionCookie (signature already checked).
 * @param {{ id?: string, email?: string | null, user_metadata?: Record<string, any> } | null} sessionData
 * @returns {{ user_Id: string | null, userName: string | null, sessionType: string | null, walletAddress: string | null }}
 */
export function parseSession(sessionData) {
  if (!sessionData?.id) {
    return { user_Id: null, userName: null, sessionType: null, walletAddress: null };
  }

  const meta = sessionData.user_metadata || {};
  const email = typeof sessionData.email === "string" ? sessionData.email.toLowerCase() : "";

  let sessionType = "traditional";
  // Staff by email domain only: user_metadata is user-editable.
  if (email.endsWith("@staff.sosseats.internal")) {
    sessionType = "staff";
  } else if (meta.sessionType === "phone" || email.endsWith("@phone.sosseats.internal")) {
    sessionType = "phone";
  }

  return {
    user_Id: sessionData.id,
    userName: meta.userName || meta.name || null,
    sessionType,
    walletAddress: null,
  };
}
