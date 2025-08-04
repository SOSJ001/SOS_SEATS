// @ts-nocheck
import * as web3 from "@solana/web3.js";
import { signTransactionKey } from "./supabase";

// create a new connection instance
export const connection = new web3.Connection(
  web3.clusterApiUrl("devnet", "confirmed")
);

// Helper function to get the currently connected wallet
function getConnectedWallet() {
  if (typeof window === "undefined") return null;

  // Check which wallet is currently connected
  if ((window as any).solana?.isConnected) {
    return (window as any).solana;
  }
  if ((window as any).solflare?.isConnected) {
    return (window as any).solflare;
  }
  if ((window as any).backpack?.isConnected) {
    return (window as any).backpack;
  }

  return null;
}

// Helper function to get any available wallet (for fallback)
function getAvailableWallet() {
  if (typeof window === "undefined") return null;

  if ((window as any).solana && (window as any).solana.isPhantom) {
    return (window as any).solana;
  }
  if ((window as any).solflare) {
    return (window as any).solflare;
  }
  if ((window as any).backpack) {
    return (window as any).backpack;
  }

  return null;
}

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
  pricePerTicket: number
) {
  try {
    // Default receiving wallet address
    const receivingWalletAddress =
      "HDCrEYrGwPBP2rqX1G7TqChzkN6ckRSpJBVF1YT1YPSF";

    // Calculate total amount using the provided price per ticket
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

    // Set the fee payer
    transaction.feePayer = new web3.PublicKey(fromWalletAddress);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    return {
      transaction,
      paymentDetails: {
        amount: totalAmount,
        currency: "USDC", // Changed to USDC
        receivingWallet: receivingWalletAddress,
        buyerWallet: fromWalletAddress,
        paymentMethod: "solana",
      },
    };
  } catch (error) {
    console.error("Error creating Solana transaction:", error);
    throw error;
  }
}

// Send transaction using connected wallet
export async function sendTransactionWithWallet(transaction: web3.Transaction) {
  try {
    // Get the connected wallet using helper function
    let wallet = getConnectedWallet();

    // If no wallet is connected, try to find any available wallet
    if (!wallet) {
      wallet = getAvailableWallet();
    }

    if (!wallet) {
      throw new Error(
        "No wallet extension found. Please install Phantom, Solflare, or Backpack."
      );
    }

    // Check if wallet is connected
    if (!wallet.isConnected) {
      throw new Error(
        "Wallet is not connected. Please connect your wallet first."
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
