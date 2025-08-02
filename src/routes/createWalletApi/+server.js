//@ts-nocheck
import { json } from "@sveltejs/kit";
import { storeWallet } from "$lib/supabase.js";
import { createNew_wallet } from "$lib/web3.js";

export async function POST({ cookies }) {
  //get the cookie
  let userSession = cookies.get("userSession");
  let web3Session = cookies.get("web3Session");
  let user_Id = null;

  // Check traditional session first
  if (userSession) {
    try {
      const sessionData = JSON.parse(userSession);
      user_Id = sessionData.id;
    } catch (error) {
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
      }
  }

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
