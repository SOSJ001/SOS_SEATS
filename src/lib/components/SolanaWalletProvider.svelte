<script lang="ts">
  import { onMount } from "svelte";
  import { clusterApiUrl } from "@solana/web3.js";
  import { walletStore } from "$lib/store.js";

  const network = clusterApiUrl("devnet"); // You can change this to 'mainnet-beta' for production

  // Type declarations for wallet objects
  declare global {
    interface Window {
      solana?: any;
      solflare?: any;
      backpack?: any;
    }
  }

  // Simple wallet detection and connection
  let walletConnected = false;
  let walletAddress = "";
  let availableWallets: string[] = [];
  let connectionError = "";
  let selectedWallet = "";

  onMount(() => {
    // Check for available wallets
    checkAvailableWallets();
  });

  function checkAvailableWallets() {
    availableWallets = [];

    // Check for Phantom
    if (
      typeof window !== "undefined" &&
      (window as any).solana &&
      (window as any).solana.isPhantom
    ) {
      availableWallets.push("Phantom");
    }

    // Check for Solflare
    if (typeof window !== "undefined" && (window as any).solflare) {
      availableWallets.push("Solflare");
    }

    // Check for Backpack
    if (typeof window !== "undefined" && (window as any).backpack) {
      availableWallets.push("Backpack");
    }

    // Update store after wallet detection
    updateStore();
  }

  function updateStore() {
    const storeData = {
      connected: walletConnected,
      address: walletAddress,
      connect: connectWallet,
      connectToSpecific: connectToSpecificWallet,
      disconnect: disconnectWallet,
      refreshWallets: checkAvailableWallets,
      available: availableWallets,
      error: connectionError,
      selectedWallet: selectedWallet,
    };

    walletStore.set(storeData);
  }

  async function connectToSpecificWallet(walletName: string) {
    connectionError = "";
    selectedWallet = walletName;

    try {
      if (
        walletName === "Phantom" &&
        typeof window !== "undefined" &&
        (window as any).solana &&
        (window as any).solana.isPhantom
      ) {
        const response = await (window as any).solana.connect();
        walletAddress = response.publicKey.toString();
        walletConnected = true;
        updateStore();
        return true;
      }

      if (
        walletName === "Solflare" &&
        typeof window !== "undefined" &&
        (window as any).solflare
      ) {
        const response = await (window as any).solflare.connect();
        walletAddress = response.publicKey.toString();
        walletConnected = true;
        updateStore();
        return true;
      }

      if (
        walletName === "Backpack" &&
        typeof window !== "undefined" &&
        (window as any).backpack
      ) {
        const response = await (window as any).backpack.connect();
        walletAddress = response.publicKey.toString();
        walletConnected = true;
        updateStore();
        return true;
      }

      connectionError = `${walletName} wallet not found or not available.`;
      updateStore();
      return false;
    } catch (error: any) {
      connectionError = error.message || `Failed to connect to ${walletName}`;
      updateStore();
      return false;
    }
  }

  async function connectWallet() {
    // If only one wallet is available, connect to it directly
    if (availableWallets.length === 1) {
      return await connectToSpecificWallet(availableWallets[0]);
    }

    // If multiple wallets are available, return false to trigger modal
    if (availableWallets.length > 1) {
      return false; // This will trigger the wallet selection modal
    }

    // No wallets available
    connectionError =
      "No wallets found. Please install Phantom, Solflare, or Backpack wallet.";
    updateStore();
    return false;
  }

  function disconnectWallet() {
    if (typeof window !== "undefined" && (window as any).solana) {
      (window as any).solana.disconnect();
    }
    if (typeof window !== "undefined" && (window as any).solflare) {
      (window as any).solflare.disconnect();
    }
    if (typeof window !== "undefined" && (window as any).backpack) {
      (window as any).backpack.disconnect();
    }

    walletConnected = false;
    walletAddress = "";
    connectionError = "";
    selectedWallet = "";
    updateStore();
  }
</script>

<div class="solana-wallet-provider">
  <slot />
</div>

<style>
  .solana-wallet-provider {
    /* Provider styles */
  }
</style>
