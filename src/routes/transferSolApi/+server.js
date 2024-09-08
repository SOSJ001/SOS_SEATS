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
  let COOKIE_DATA = cookies.get("userSession");
  COOKIE_DATA = JSON.parse(COOKIE_DATA);
  const user_Id = COOKIE_DATA?.id; //this is theuser id

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
