// @ts-nocheck
import { createNew_wallet, getBalance } from "$lib/web3";
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
    } catch (error) {}
  }

  // Check Web3 session if no traditional session
  if (!user_Id && web3Session) {
    try {
      const sessionData = JSON.parse(web3Session);
      if (sessionData.type === "web3" && sessionData.user) {
        user_Id = sessionData.user.id;
      }
    } catch (error) {}
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
  }
  return { status, publickey, balance, user_Id };
}
