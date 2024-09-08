// @ts-nocheck
import { createNew_wallet, getBalance } from "$lib/web3.js";
import { storeWallet, usersAndPublickeys } from "$lib/supabase.js";
export async function load({ cookies, depends }) {
  depends("data:balance");
  let COOKIE_DATA = cookies.get("userSession");
  if (COOKIE_DATA) COOKIE_DATA = JSON.parse(COOKIE_DATA);
  const user_Id = COOKIE_DATA?.id;
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
