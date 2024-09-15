// @ts-nocheck
import * as web3 from "@solana/web3.js";
import { signTransactionKey } from "./supabase";

// create a new connection instance
export const connection = new web3.Connection(
  web3.clusterApiUrl("devnet", "confirmed")
);

// check if owner has created a wallet
export async function createNew_wallet() {
  const wallet = web3.Keypair.generate();
  return wallet;
}

//get balance function
export async function getBalance(publickey) {
  try {
     const lamportBalance = await connection.getBalance(
    new web3.PublicKey(publickey)
  );
  const balance = lamportBalance / web3.LAMPORTS_PER_SOL;
  return balance;
  } catch (error) {
    console.log("error getting balance from getBalance() :", console.error(error));
    return null
  }
 
}

//transfer sol
export async function transferSol(user_id, from, to, amount) {
  let transaction;
  let wallet = await signTransactionKey(user_id);
  const array = Object.values(wallet.data[0].wallet.secretKey);
  //generate the signature
  const keypair = web3.Keypair.fromSecretKey(Uint8Array.from(array));
  //check if the pairs are the same with the publickey
  if (keypair.publicKey.toBase58() === from) {
    // trasnsfer SOL
    transaction = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: new web3.PublicKey(from),
        toPubkey: new web3.PublicKey(to),
        lamports: amount * web3.LAMPORTS_PER_SOL,
      })
    );
    // set the end user as the fee payer
    transaction.feePayer = new web3.PublicKey(from);

    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    
    return { transaction, keypair };
  } else {
    return null;
  }
}
