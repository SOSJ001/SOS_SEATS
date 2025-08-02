/**
 * Utility functions for handling both traditional and Web3 sessions
 */

/**
 * Parse session data from cookies, supporting both traditional and Web3 sessions
 * @param {Object} cookies - SvelteKit cookies object
 * @returns {Object} - { user_Id, userName, sessionType, walletAddress }
 */
export function parseSession(cookies) {
  const userSession = cookies.get("userSession");
  const web3Session = cookies.get("web3Session");

  let user_Id = null;
  let userName = null;
  let sessionType = null;
  let walletAddress = null;

  // Check traditional session first
  if (userSession) {
    try {
      const sessionData = JSON.parse(userSession);
      user_Id = sessionData.id;
      userName =
        sessionData.user_metadata?.userName || sessionData.user_metadata?.name;
      sessionType = "traditional";
    } catch (error) {
      }
  }

  // Check Web3 session if no traditional session
  if (!user_Id && web3Session) {
    try {
      const sessionData = JSON.parse(web3Session);
      if (sessionData.type === "web3" && sessionData.user) {
        user_Id = sessionData.user.id;
        userName = sessionData.user.username || sessionData.user.display_name;
        sessionType = "web3";
        walletAddress = sessionData.wallet_address;
      }
    } catch (error) {
      }
  }

  return { user_Id, userName, sessionType, walletAddress };
}

/**
 * Validate that a valid session exists
 * @param {Object} cookies - SvelteKit cookies object
 * @returns {{ valid: boolean, user_Id: string | null, sessionType: string | null }} - Session validation result
 */
export function validateSession(cookies) {
  const { user_Id, sessionType } = parseSession(cookies);
  return {
    valid: !!user_Id,
    user_Id,
    sessionType,
  };
}
 