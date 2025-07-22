// @ts-nocheck
import { createNew_wallet, getBalance } from "$lib/web3.js";
import { storeWallet, usersAndPublickeys } from "$lib/supabase.js";
export async function load({ cookies, depends }) {
  depends("data:balance");
  let userSession = cookies.get("userSession");
  let web3Session = cookies.get("web3Session");
  let user_Id = null;

  // Check traditional session first
  if (userSession) {
    try {
      const sessionData = JSON.parse(userSession);
      user_Id = sessionData.id;
    } catch (error) {
      console.error('Error parsing traditional session:', error);
    }
  }
  
  // Check Web3 session if no traditional session
  if (!user_Id && web3Session) {
    try {
      const sessionData = JSON.parse(web3Session);
      if (sessionData.type === 'web3' && sessionData.user) {
        user_Id = sessionData.user.id;
      }
    } catch (error) {
      console.error('Error parsing Web3 session:', error);
    }
  }
  // check if user has a wallet
  const { data, error } = await usersAndPublickeys(user_Id);
  let status = false;
  let publickey;
  let balance;
  if (!error) {
    if (data.length === 1) {
      publickey = data[0].publicKey;
      balance = await getBalance(publickey);
      status = true;
    }
  } else {
    console.log("Error getting users and public key", error.message);
  }
  return { status, publickey, balance, user_Id };
}
