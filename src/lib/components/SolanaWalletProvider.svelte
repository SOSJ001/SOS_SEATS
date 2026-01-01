<script lang="ts">
  import { onMount } from "svelte";
  import { walletStore, web3UserStore } from "$lib/store";
  import {
    checkWalletExists,
    createWeb3User,
    recordWeb3SignIn,
    createWeb3Session,
    clearWeb3Session,
    verifyWeb3Session,
  } from "$lib/supabase.js";

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

  onMount(async () => {
    // Check for available wallets
    checkAvailableWallets();

    // Providers may inject after mount; re-check shortly after
    setTimeout(checkAvailableWallets, 300);
    setTimeout(checkAvailableWallets, 1500);

    // Set up wallet connection state listeners
    setupWalletListeners();

    // Implement hybrid approach: try auto-connect if session exists, else clear session
    await handleSessionAndWalletSync();
  });

  // Set up listeners for wallet connection state changes
  function setupWalletListeners() {
    // Phantom wallet listeners
    if (
      typeof window !== "undefined" &&
      (window as any).solana &&
      (window as any).solana.isPhantom
    ) {
      (window as any).solana.on("connect", () => {
        // Don't auto-authenticate here, let the user do it manually
      });

      (window as any).solana.on("disconnect", () => {
        // Clear session when wallet is disconnected
        handleWalletDisconnect();
      });

      (window as any).solana.on("accountChanged", (publicKey: any) => {
        if (publicKey) {
          // Account changed, update wallet address
          const newAddress = publicKey.toString();
          if (newAddress !== walletAddress) {
            walletAddress = newAddress;
            updateStore();
          }
        } else {
          // Account cleared, handle as disconnect
          handleWalletDisconnect();
        }
      });
    }

    // Brave wallet listeners
    if (
      typeof window !== "undefined" &&
      (window as any).solana &&
      (((window as any).solana as any).isBraveWallet === true ||
        typeof (navigator as any)?.brave !== "undefined" ||
        ((navigator as any)?.userAgent || "").includes("Brave"))
    ) {
      (window as any).solana.on("connect", () => {
        // Don't auto-authenticate here, let the user do it manually
      });

      (window as any).solana.on("disconnect", () => {
        // Clear session when wallet is disconnected
        handleWalletDisconnect();
      });

      (window as any).solana.on("accountChanged", (publicKey: any) => {
        if (publicKey) {
          // Account changed, update wallet address
          const newAddress = publicKey.toString();
          if (newAddress !== walletAddress) {
            walletAddress = newAddress;
            updateStore();
          }
        } else {
          // Account cleared, handle as disconnect
          handleWalletDisconnect();
        }
      });
    }
  }

  // Handle wallet disconnect (called when wallet is disconnected externally)
  async function handleWalletDisconnect() {
    // Clear wallet state
    walletConnected = false;
    walletAddress = "";
    connectionError = "";
    selectedWallet = "";

    // Clear Web3 session since wallet is no longer connected
    await signOutWeb3();

    updateStore();
  }

  // Hybrid approach: Try auto-connect if session exists, else clear session
  async function handleSessionAndWalletSync() {
    try {
      // First, check if we have a Web3 session
      const sessionResult = await verifyWeb3Session();

      if (sessionResult.success && sessionResult.user) {
        // Try to auto-connect to the wallet
        const autoConnectResult = await attemptWalletAutoConnect();

        if (autoConnectResult.success) {
          // Wallet connected successfully, restore session state
          isAuthenticated = true;
          web3User = sessionResult.user;
          walletConnected = true;
          walletAddress = autoConnectResult.walletAddress || "";
          selectedWallet = autoConnectResult.walletName || "";
          authError = null;
          updateStore();
        } else {
          // Auto-connect failed, clear the session
          await clearWeb3Session();
          isAuthenticated = false;
          web3User = null;
          walletConnected = false;
          walletAddress = "";
          selectedWallet = "";
          authError = null;
          updateStore();
        }
      } else {
      }
    } catch (error) {
      // Clear session on any error
      await clearWeb3Session();
      isAuthenticated = false;
      web3User = null;
      updateStore();
    }
  }

  // Attempt to auto-connect to available wallets
  async function attemptWalletAutoConnect() {
    try {
      // Try Phantom first (most common)
      if (
        typeof window !== "undefined" &&
        (window as any).solana &&
        (window as any).solana.isPhantom
      ) {
        try {
          const response = await (window as any).solana.connect({
            onlyIfTrusted: true,
          });
          if (response && response.publicKey) {
            return {
              success: true,
              walletAddress: response.publicKey.toString(),
              walletName: "Phantom",
            };
          }
        } catch (error) {}
      }

      // Try Brave Wallet
      if (
        typeof window !== "undefined" &&
        (window as any).solana &&
        (((window as any).solana as any).isBraveWallet === true ||
          typeof (navigator as any)?.brave !== "undefined" ||
          ((navigator as any)?.userAgent || "").includes("Brave"))
      ) {
        try {
          const provider: any =
            (window as any).braveSolana || (window as any).solana;
          const response = await provider.connect({
            onlyIfTrusted: true,
          });
          if (response && response.publicKey) {
            return {
              success: true,
              walletAddress: response.publicKey.toString(),
              walletName: "Brave",
            };
          }
        } catch (error) {}
      }

      // Try Solflare
      if (typeof window !== "undefined" && (window as any).solflare) {
        try {
          // Solflare doesn't have onlyIfTrusted, but we can try to get the public key
          if ((window as any).solflare.isConnected) {
            const publicKey = (window as any).solflare.publicKey;
            if (publicKey) {
              return {
                success: true,
                walletAddress: publicKey.toString(),
                walletName: "Solflare",
              };
            }
          }
        } catch (error) {}
      }

      // Try Backpack
      if (typeof window !== "undefined" && (window as any).backpack) {
        try {
          // Backpack doesn't have onlyIfTrusted, but we can try to get the public key
          if ((window as any).backpack.isConnected) {
            const publicKey = (window as any).backpack.publicKey;
            if (publicKey) {
              return {
                success: true,
                walletAddress: publicKey.toString(),
                walletName: "Backpack",
              };
            }
          }
        } catch (error) {}
      }

      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

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

    // Check for Brave Wallet
    if (
      typeof window !== "undefined" &&
      (window as any).solana &&
      (((window as any).solana as any).isBraveWallet === true ||
        typeof (navigator as any)?.brave !== "undefined" ||
        ((navigator as any)?.userAgent || "").includes("Brave"))
    ) {
      availableWallets.push("Brave");
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
    username?: string,
    displayName?: string
  ) {
    isLoading = true;
    authError = null;
    updateStore();

    try {
      // Check if wallet exists
      const walletCheck = await checkWalletExists(walletAddress);
      let userData = null;

      if (walletCheck.exists && walletCheck.user) {
        // User exists, record sign in
        const signInResult = await recordWeb3SignIn(walletAddress);
        if (signInResult.success) {
          userData = signInResult.user;
        } else {
          authError = signInResult.error || "Failed to sign in";
        }
      } else {
        // User doesn't exist, create new account
        if (!username) {
          authError = "Username required for new account";
          isLoading = false;
          updateStore();
          return { success: false, needsUsername: true };
        }

        const createResult = await createWeb3User(
          walletAddress,
          username as any,
          displayName as any
        );
        if (createResult.success) {
          userData = createResult.user;
        } else {
          authError = createResult.error || "Failed to create account";
        }
      }

      // If authentication was successful, create session
      if (userData) {
        const sessionResult = await createWeb3Session(walletAddress, userData);
        if (sessionResult.success) {
          isAuthenticated = true;
          web3User = userData;
          authError = null;
        } else {
          authError = sessionResult.error || "Failed to create session";
        }
      }
    } catch (error: any) {
      authError = error.message || "Authentication failed";
    }

    isLoading = false;
    updateStore();
    return { success: isAuthenticated, needsUsername: false };
  }

  async function signOutWeb3() {
    // Clear Web3 session cookie
    await clearWeb3Session();

    // Clear local state
    isAuthenticated = false;
    web3User = null;
    authError = null;
    updateStore();
  }

  async function updateWeb3Profile(walletAddress: string, updates: any) {
    // This would call the updateWeb3UserProfile function
    // Implementation depends on your needs
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
        const provider: any =
          (window as any).phantom?.solana || (window as any).solana;
        response = await provider.connect();
      } else if (
        walletName === "Brave" &&
        typeof window !== "undefined" &&
        (window as any).solana &&
        (((window as any).solana as any).isBraveWallet === true ||
          typeof (navigator as any)?.brave !== "undefined" ||
          ((navigator as any)?.userAgent || "").includes("Brave"))
      ) {
        const provider: any =
          (window as any).braveSolana || (window as any).solana;
        response = await provider.connect();
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
        console.error("[Wallet] Provider not found:", walletName);
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
      console.error("[Wallet] Connect error:", walletName, error);
      connectionError = error?.message || `Failed to connect to ${walletName}`;
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
      "No wallets found. Please install Phantom, Brave, Solflare, or Backpack wallet.";
    updateStore();
    return false;
  }

  function disconnectWallet() {
    // Disconnect from wallet extensions
    if (typeof window !== "undefined" && (window as any).solana) {
      try {
        ((window as any).braveSolana || (window as any).solana).disconnect();
      } catch {}
    }
    if (typeof window !== "undefined" && (window as any).solflare) {
      (window as any).solflare.disconnect();
    }
    if (typeof window !== "undefined" && (window as any).backpack) {
      (window as any).backpack.disconnect();
    }

    // Clear wallet state
    walletConnected = false;
    walletAddress = "";
    connectionError = "";
    selectedWallet = "";

    // Also sign out from Web3 (this will clear the session)
    signOutWeb3();

    updateStore();
  }
</script>

<div class="solana-wallet-provider">
  <slot />
</div>

<style>
  .solana-wallet-provider {
    display: contents;
  }
</style>
