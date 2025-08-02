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
export async function getBalance(publickey: string) {
  try {
    const lamportBalance = await connection.getBalance(
      new web3.PublicKey(publickey)
    );
    const balance = lamportBalance / web3.LAMPORTS_PER_SOL;
    return balance;
  } catch (error) {
    console.error("Error getting balance:", error);
    return null;
  }
}

//transfer sol
export async function transferSol(
  user_id: string,
  from: string,
  to: string,
  amount: number
) {
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

// Purchase tickets using connected wallet
export async function purchaseTicketsWithSolana(
  fromWalletAddress: string,
  ticketQuantity: number,
  pricePerTicket: number = 0.01
) {
  try {
    // Default receiving wallet address
    const receivingWalletAddress =
      "HDCrEYrGwPBP2rqX1G7TqChzkN6ckRSpJBVF1YT1YPSF";

    // Calculate total amount
    const totalAmount = ticketQuantity * pricePerTicket;

    // Check if wallet is connected
    if (!fromWalletAddress) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    // Check wallet balance
    const balance = await getBalance(fromWalletAddress);
    if (balance === null || balance < totalAmount) {
      throw new Error(
        `Insufficient balance. You need ${totalAmount} SOL but have ${
          balance || 0
        } SOL.`
      );
    }

    // Create transaction
    const transaction = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: new web3.PublicKey(fromWalletAddress),
        toPubkey: new web3.PublicKey(receivingWalletAddress),
        lamports: totalAmount * web3.LAMPORTS_PER_SOL,
      })
    );

    // Set fee payer
    transaction.feePayer = new web3.PublicKey(fromWalletAddress);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    return {
      success: true,
      transaction,
      totalAmount,
      receivingWalletAddress,
      fromWalletAddress,
      ticketQuantity,
    };
  } catch (error: any) {
    console.error("Error creating purchase transaction:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Send transaction using connected wallet
export async function sendTransactionWithWallet(transaction: web3.Transaction) {
  try {
    // Get the connected wallet (Phantom, Solflare, etc.)
    let wallet: any = null;

    if (typeof window !== "undefined") {
      if ((window as any).solana && (window as any).solana.isPhantom) {
        wallet = (window as any).solana;
      } else if ((window as any).solflare) {
        wallet = (window as any).solflare;
      } else if ((window as any).backpack) {
        wallet = (window as any).backpack;
      }
    }

    if (!wallet) {
      throw new Error(
        "No wallet extension found. Please install Phantom, Solflare, or Backpack."
      );
    }

    // Send transaction
    const signature = await wallet.signAndSendTransaction(transaction);

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(
      signature.signature,
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error("Transaction failed to confirm");
    }

    return {
      success: true,
      signature: signature.signature,
      confirmation,
    };
  } catch (error: any) {
    console.error("Error sending transaction:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
