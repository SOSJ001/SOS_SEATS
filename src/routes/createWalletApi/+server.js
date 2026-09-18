//@ts-nocheck
import { json } from "@sveltejs/kit";
import { storeWallet } from "$lib/supabase.js";
import { createNew_wallet } from "$lib/web3";

export async function POST({ locals }) {
  const user_Id = locals.web3UserId ?? locals.userId;

  if (!user_Id) {
    return json({ error: "No valid session found" }, { status: 401 });
  }
  const keypair = await createNew_wallet();
  const publicKey = keypair.publicKey.toBase58();
  const { error } = await storeWallet(user_Id, keypair._keypair, publicKey);
  let status = false;
  if (!error) {
    status = true;
  }
  return json({ publicKey, status }, { status: 201 });
}
