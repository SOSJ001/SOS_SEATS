<script lang="ts">
  import { onMount } from "svelte";
  import { clusterApiUrl } from "@solana/web3.js";
  import { walletStore, web3UserStore } from "$lib/store";
  import {
    checkWalletExists,
    createWeb3User,
    recordWeb3SignIn,
    createWeb3Session,
    clearWeb3Session,
    verifyWeb3Session,
  } from "$lib/supabase.js";

  const network = clusterApiUrl("devnet"); // You can change this to 'mainnet-beta' for production

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
        console.log("🔗 Phantom wallet connected");
        // Don't auto-authenticate here, let the user do it manually
      });

      (window as any).solana.on("disconnect", () => {
        console.log("🔌 Phantom wallet disconnected");
        // Clear session when wallet is disconnected
        handleWalletDisconnect();
      });

      (window as any).solana.on("accountChanged", (publicKey: any) => {
        console.log("🔄 Phantom account changed:", publicKey?.toString());
        if (publicKey) {
          // Account changed, update wallet address
          walletAddress = publicKey.toString();
          updateStore();
        } else {
          // Account cleared, handle as disconnect
          handleWalletDisconnect();
        }
      });
    }

    // Solflare wallet listeners
    if (typeof window !== "undefined" && (window as any).solflare) {
      (window as any).solflare.on("connect", () => {
        console.log("🔗 Solflare wallet connected");
      });

      (window as any).solflare.on("disconnect", () => {
        console.log("🔌 Solflare wallet disconnected");
        handleWalletDisconnect();
      });

      (window as any).solflare.on("accountChanged", (publicKey: any) => {
        console.log("🔄 Solflare account changed:", publicKey?.toString());
        if (publicKey) {
          walletAddress = publicKey.toString();
          updateStore();
        } else {
          handleWalletDisconnect();
        }
      });
    }

    // Backpack wallet listeners
    if (typeof window !== "undefined" && (window as any).backpack) {
      (window as any).backpack.on("connect", () => {
        console.log("🔗 Backpack wallet connected");
      });

      (window as any).backpack.on("disconnect", () => {
        console.log("🔌 Backpack wallet disconnected");
        handleWalletDisconnect();
      });

      (window as any).backpack.on("accountChanged", (publicKey: any) => {
        console.log("🔄 Backpack account changed:", publicKey?.toString());
        if (publicKey) {
          walletAddress = publicKey.toString();
          updateStore();
        } else {
          handleWalletDisconnect();
        }
      });
    }
  }

  // Handle wallet disconnect (called when wallet is disconnected externally)
  async function handleWalletDisconnect() {
    console.log("🔌 Handling external wallet disconnect...");

    // Clear wallet state
    walletConnected = false;
    walletAddress = "";
    connectionError = "";
    selectedWallet = "";

    // Clear Web3 session since wallet is no longer connected
    await signOutWeb3();

    updateStore();
    console.log("✅ External wallet disconnect handled");
  }

  // Hybrid approach: Try auto-connect if session exists, else clear session
  async function handleSessionAndWalletSync() {
    try {
      console.log("🔄 Starting session and wallet sync...");

      // First, check if we have a Web3 session
      const sessionResult = await verifyWeb3Session();

      if (sessionResult.success && sessionResult.user) {
        console.log("✅ Web3 session found, attempting wallet auto-connect...");

        // Try to auto-connect to the wallet
        const autoConnectResult = await attemptWalletAutoConnect();

        if (autoConnectResult.success) {
          // Wallet connected successfully, restore session state
          console.log(
            "✅ Wallet auto-connect successful, restoring session..."
          );
          isAuthenticated = true;
          web3User = sessionResult.user;
          walletConnected = true;
          walletAddress = autoConnectResult.walletAddress || "";
          selectedWallet = autoConnectResult.walletName || "";
          authError = null;
          updateStore();
          console.log("✅ Session and wallet state restored successfully");
        } else {
          // Auto-connect failed, clear the session
          console.log("❌ Wallet auto-connect failed, clearing session...");
          await clearWeb3Session();
          isAuthenticated = false;
          web3User = null;
          walletConnected = false;
          walletAddress = "";
          selectedWallet = "";
          authError = null;
          updateStore();
          console.log("✅ Session cleared due to wallet unavailability");
        }
      } else {
        console.log("ℹ️ No valid Web3 session found");
      }
    } catch (error) {
      console.error("❌ Error in session and wallet sync:", error);
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
          console.log("🔄 Attempting Phantom auto-connect...");
          const response = await (window as any).solana.connect({
            onlyIfTrusted: true,
          });
          if (response && response.publicKey) {
            console.log("✅ Phantom auto-connect successful");
            return {
              success: true,
              walletAddress: response.publicKey.toString(),
              walletName: "Phantom",
            };
          }
        } catch (error) {
          console.log(
            "ℹ️ Phantom auto-connect failed (expected if not previously connected)"
          );
        }
      }

      // Try Solflare
      if (typeof window !== "undefined" && (window as any).solflare) {
        try {
          console.log("🔄 Attempting Solflare auto-connect...");
          // Solflare doesn't have onlyIfTrusted, but we can try to get the public key
          if ((window as any).solflare.isConnected) {
            const publicKey = (window as any).solflare.publicKey;
            if (publicKey) {
              console.log("✅ Solflare auto-connect successful");
              return {
                success: true,
                walletAddress: publicKey.toString(),
                walletName: "Solflare",
              };
            }
          }
        } catch (error) {
          console.log("ℹ️ Solflare auto-connect failed");
        }
      }

      // Try Backpack
      if (typeof window !== "undefined" && (window as any).backpack) {
        try {
          console.log("🔄 Attempting Backpack auto-connect...");
          // Backpack doesn't have onlyIfTrusted, but we can try to get the public key
          if ((window as any).backpack.isConnected) {
            const publicKey = (window as any).backpack.publicKey;
            if (publicKey) {
              console.log("✅ Backpack auto-connect successful");
              return {
                success: true,
                walletAddress: publicKey.toString(),
                walletName: "Backpack",
              };
            }
          }
        } catch (error) {
          console.log("ℹ️ Backpack auto-connect failed");
        }
      }

      console.log("❌ No wallet auto-connect successful");
      return { success: false };
    } catch (error) {
      console.error("❌ Error in wallet auto-connect:", error);
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
    console.log("🔐 Starting authentication for wallet:", walletAddress);
    isLoading = true;
    authError = null;
    updateStore();

    try {
      // Check if wallet exists
      console.log("🔍 Checking if wallet exists...");
      const walletCheck = await checkWalletExists(walletAddress);
      console.log("Wallet check result:", walletCheck);

      let userData = null;

      if (walletCheck.exists && walletCheck.user) {
        // User exists, record sign in
        console.log("👤 User exists, recording sign in...");
        const signInResult = await recordWeb3SignIn(walletAddress);
        console.log("Sign in result:", signInResult);
        if (signInResult.success) {
          userData = signInResult.user;
          console.log("✅ Sign in successful");
        } else {
          authError = signInResult.error || "Failed to sign in";
          console.log("❌ Sign in failed:", authError);
        }
      } else {
        // User doesn't exist, create new account
        console.log("🆕 User doesn't exist, needs username:", !username);
        if (!username) {
          authError = "Username required for new account";
          isLoading = false;
          updateStore();
          console.log("📝 Returning needsUsername: true");
          return { success: false, needsUsername: true };
        }

        console.log("👤 Creating new user...");
        const createResult = await createWeb3User(
          walletAddress,
          username as any,
          displayName as any
        );
        console.log("Create user result:", createResult);
        if (createResult.success) {
          userData = createResult.user;
          console.log("✅ User created successfully");
        } else {
          authError = createResult.error || "Failed to create account";
          console.log("❌ User creation failed:", authError);
        }
      }

      // If authentication was successful, create session
      if (userData) {
        console.log("🔐 Creating Web3 session...");
        const sessionResult = await createWeb3Session(walletAddress, userData);
        if (sessionResult.success) {
          isAuthenticated = true;
          web3User = userData;
          authError = null;
          console.log("✅ Web3 session created successfully");
        } else {
          authError = sessionResult.error || "Failed to create session";
          console.log("❌ Session creation failed:", authError);
        }
      }
    } catch (error: any) {
      authError = error.message || "Authentication failed";
      console.log("❌ Authentication error:", error);
    }

    isLoading = false;
    updateStore();
    console.log(
      "🔐 Authentication complete. Success:",
      isAuthenticated,
      "Error:",
      authError
    );
    return { success: isAuthenticated, needsUsername: false };
  }

  async function signOutWeb3() {
    console.log("🚪 Signing out from Web3...");
    // Clear Web3 session cookie
    await clearWeb3Session();

    // Clear local state
    isAuthenticated = false;
    web3User = null;
    authError = null;
    updateStore();
    console.log("✅ Web3 sign out complete");
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
    console.log("🔌 Disconnecting wallet...");

    // Disconnect from wallet extensions
    if (typeof window !== "undefined" && (window as any).solana) {
      (window as any).solana.disconnect();
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
    console.log("✅ Wallet disconnect complete");
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
