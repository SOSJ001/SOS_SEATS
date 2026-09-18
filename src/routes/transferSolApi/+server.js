//@ts-nocheck
import { json } from "@sveltejs/kit";
import { connection } from "$lib/web3";
import { listWalletDirectory } from "$lib/server/walletDirectory";
import { transferSol } from "$lib/web3";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import { sendAndConfirmTransaction } from "@solana/web3.js";

export async function POST({ request, locals }) {
  const { publickey, userName, amount } = await request.json();
  let payload;
  const user_Id = locals.web3UserId ?? locals.userId;

  if (!user_Id) {
    return json({ error: "No valid session found" }, { status: 401 });
  }

  const response = await listWalletDirectory();
  if (!response.error) {
    let userExists = response.data.find(
      (arr) =>
        arr.username &&
        arr.username.toLowerCase() === userName.toLowerCase()
    );
    if (userExists) {
      const transferResponse = await transferSol(
        user_Id,
        publickey,
        userExists.publicKey,
        amount
      );
      if (transferResponse !== null) {
        payload = await sendAndConfirmTransaction(
          connection,
          transferResponse.transaction,
          [transferResponse.keypair]
        );
      }
    } else {
      return;
    }
  }
  return json({ payload }, { headers: ACTIONS_CORS_HEADERS, status: 201 });
}
