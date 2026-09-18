// @ts-nocheck
import { getBalance } from "$lib/web3";
import { usersAndPublickeys } from "$lib/supabase.js";

export async function load({ locals, depends }) {
  depends("data:balance");
  const user_Id = locals.web3UserId ?? locals.userId;

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
