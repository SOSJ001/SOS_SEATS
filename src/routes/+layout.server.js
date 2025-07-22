import { parseSession } from "$lib/sessionUtils.js";

export function load({ cookies }) {
  const { user_Id, userName, sessionType, walletAddress } = parseSession(cookies);
  
  return { 
    cookievar1: user_Id, 
    sessionType, 
    walletAddress,
    userName
  };
}
