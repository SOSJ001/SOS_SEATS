//@ts-nocheck
import { json } from "@sveltejs/kit";
import { connection } from "$lib/web3.js";
import { searchWalletAndUserName } from "$lib/supabase.js";
import { transferSol } from "$lib/web3.js";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import { sendAndConfirmTransaction } from "@solana/web3.js";

export async function POST({ cookies, request }) {
  const { publickey, userName, amount } = await request.json();
  let payload;
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

  if (!user_Id) {
    return json({ error: "No valid session found" }, { status: 401 });
  }

  // search for the wallet of that userName
  const response = await searchWalletAndUserName();
  if (!response.error) {
    //check if the user exists
    let userExists = response.data.find(
      (arr) => arr.username.toLowerCase() === userName.toLowerCase()
    );
    if (userExists) {
      //build the transaction
      const response = await transferSol(
        user_Id,
        publickey,
        userExists.publicKey,
        amount
      );
      if (response !== null) {
        payload = await sendAndConfirmTransaction(
          connection,
          response.transaction,
          [response.keypair]
        );
      }
    } else {
      console.log("User Not found");
      return;
    }
  } else {
    console.log("error getting userName: \n", response.error.message);
  }
  return json({ payload }, { headers: ACTIONS_CORS_HEADERS, status: 201 });
}
