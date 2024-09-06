// check if owner has created a wallet

import { Keypair } from "@solana/web3.js";

export async function createNew_wallet() {
  const wallet = Keypair.generate();
  return wallet;
}
