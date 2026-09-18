// @ts-nocheck
import { getBalance } from "$lib/web3";
import { getUserPublicKey } from "$lib/server/walletDirectory";

export async function load({ locals, depends }) {
  depends("data:balance");
  const user_Id = locals.web3UserId ?? locals.userId;

  const { data, error } = await getUserPublicKey(user_Id);
  let status = false;
  let publickey;
  let balance;
  if (!error) {
    if (data.length === 1) {
      publickey = data[0].publicKey;
      balance = await getBalance(publickey);
      status = true;
    }
  }
  return { status, publickey, balance, user_Id };
}
