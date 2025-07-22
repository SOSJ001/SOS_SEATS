<script lang="ts">
  import { onMount } from "svelte";
  import { clusterApiUrl } from "@solana/web3.js";
  import { walletStore, web3UserStore } from "$lib/store";
  import {
    checkWalletExists,
    createWeb3User,
    recordWeb3SignIn,
  } from "$lib/supabase.js";

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

  // Web3 authentication state
  let isAuthenticated = false;
  let web3User: any = null;
  let isLoading = false;
  let authError: string | null = null;

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

    // Update Web3 user store
    const web3StoreData = {
      isAuthenticated,
      user: web3User,
      isLoading,
      error: authError,
      authenticate: authenticateWallet,
      signOut: signOutWeb3,
      updateProfile: updateWeb3Profile,
    };

    web3UserStore.set(web3StoreData);
  }

  // Web3 Authentication Functions
  async function authenticateWallet(
    walletAddress: string,
    username?: string | null,
    displayName?: string | null
  ) {
    console.log('🔐 Starting authentication for wallet:', walletAddress);
    isLoading = true;
    authError = null;
    updateStore();

    try {
      // Check if wallet exists
      console.log('🔍 Checking if wallet exists...');
      const walletCheck = await checkWalletExists(walletAddress);
      console.log('Wallet check result:', walletCheck);

      if (walletCheck.exists && walletCheck.user) {
        // User exists, record sign in
        console.log('👤 User exists, recording sign in...');
        const signInResult = await recordWeb3SignIn(walletAddress);
        console.log('Sign in result:', signInResult);
        if (signInResult.success) {
          isAuthenticated = true;
          web3User = signInResult.user;
          authError = null;
          console.log('✅ Sign in successful');
        } else {
          authError = signInResult.error || "Failed to sign in";
          console.log('❌ Sign in failed:', authError);
        }
      } else {
        // User doesn't exist, create new account
        console.log('🆕 User doesn\'t exist, needs username:', !username);
        if (!username) {
          authError = "Username required for new account";
          isLoading = false;
          updateStore();
          console.log('📝 Returning needsUsername: true');
          return { success: false, needsUsername: true };
        }

        console.log('👤 Creating new user...');
        const createResult = await createWeb3User(
          walletAddress,
          username,
          displayName
        );
        console.log('Create user result:', createResult);
        if (createResult.success) {
          isAuthenticated = true;
          web3User = createResult.user;
          authError = null;
          console.log('✅ User created successfully');
        } else {
          authError = createResult.error || "Failed to create account";
          console.log('❌ User creation failed:', authError);
        }
      }
    } catch (error: any) {
      authError = error.message || "Authentication failed";
      console.log('❌ Authentication error:', error);
    }

    isLoading = false;
    updateStore();
    console.log('🔐 Authentication complete. Success:', isAuthenticated, 'Error:', authError);
    return { success: isAuthenticated, needsUsername: false };
  }

  function signOutWeb3() {
    isAuthenticated = false;
    web3User = null;
    authError = null;
    updateStore();
  }

  async function updateWeb3Profile(walletAddress: string, updates: any) {
    // This would call the updateWeb3UserProfile function
    // Implementation depends on your needs
    console.log("Update profile:", walletAddress, updates);
  }

  async function connectToSpecificWallet(walletName: string) {
    connectionError = "";
    selectedWallet = walletName;

    try {
      let response;

      if (
        walletName === "Phantom" &&
        typeof window !== "undefined" &&
        (window as any).solana &&
        (window as any).solana.isPhantom
      ) {
        response = await (window as any).solana.connect();
      } else if (
        walletName === "Solflare" &&
        typeof window !== "undefined" &&
        (window as any).solflare
      ) {
        response = await (window as any).solflare.connect();
      } else if (
        walletName === "Backpack" &&
        typeof window !== "undefined" &&
        (window as any).backpack
      ) {
        response = await (window as any).backpack.connect();
      } else {
        connectionError = `${walletName} wallet not found or not available.`;
        updateStore();
        return false;
      }

      // Set wallet connection state
      walletAddress = response.publicKey.toString();
      walletConnected = true;
      updateStore();

      // Now authenticate the wallet with the database
      const authResult = await authenticateWallet(walletAddress);

      if (authResult.needsUsername) {
        // Return special flag to trigger username setup modal
        return { success: true, needsUsername: true };
      }

      return authResult.success;
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

    // Also sign out from Web3
    signOutWeb3();

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
