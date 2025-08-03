import { parseSession } from "$lib/sessionUtils.js";

export async function load({ cookies }) {
  try {
    // Parse session data to get wallet address
    const { user_Id, userName, sessionType, walletAddress } =
      parseSession(cookies);

    return {
      walletAddress,
      sessionType,
      userName,
    };
  } catch (error) {
    console.error("Error in my-tickets server load:", error);
    return {
      walletAddress: null,
      sessionType: null,
      userName: null,
    };
  }
}
