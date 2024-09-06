//@ts-nocheck
import { json } from "@sveltejs/kit";
import { storeWallet } from "$lib/supabase.js";
import { createNew_wallet } from "$lib/web3.js";

export async function POST({ cookies }) {
  //get the cookie
  let COOKIE_DATA = cookies.get("userSession");
  COOKIE_DATA = JSON.parse(COOKIE_DATA);
  const user_Id = COOKIE_DATA?.id;
  const keypair = await createNew_wallet();
  const publicKey = keypair.publicKey.toBase58();
  const { error } = await storeWallet(user_Id, keypair._keypair, publicKey);
  let status = false;
  if (!error) {
    status = true;
  }
  return json({ publicKey, status }, { status: 201 });
}
