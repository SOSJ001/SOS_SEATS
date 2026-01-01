<script lang="ts">
  import { walletStore, web3UserStore, showToast } from "$lib/store";
  import WalletSelectionModal from "./WalletSelectionModal.svelte";
  import UsernameSetupModal from "./UsernameSetupModal.svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  let walletConnected = false;
  let walletAddress = "";
  let availableWallets: string[] = [];
  let connectionError = "";
  let showWalletModal = false;
  let showUsernameModal = false;
  let walletData: any = null;
  let web3Data: any = null;
  let currentPath = "";

  // Subscribe to page to get current path
  page.subscribe(($page) => {
    currentPath = $page.url.pathname;
  });

  // Subscribe to wallet store
  walletStore.subscribe((data) => {
    walletData = data;
    walletConnected = data.connected || false;
    walletAddress = data.address || "";
    availableWallets = data.available || [];
    connectionError = data.error || "";
  });

  // Subscribe to Web3 user store
  web3UserStore.subscribe((data) => {
    web3Data = data;
  });

  // Track previous wallet connection state to detect changes
  let previousWalletConnected = false;
  let previousWalletAddress = "";
  let hasShownConnectionToast = false;
  let isConnectingFromModal = false;
  let currentConnectionSession = null;

  // Watch for wallet connection changes and show appropriate toasts
  $: if (
    walletConnected !== previousWalletConnected ||
    walletAddress !== previousWalletAddress
  ) {
    if (walletConnected && walletAddress) {
      // Wallet connected or changed
      if (
        walletAddress !== previousWalletAddress &&
        previousWalletAddress &&
        previousWalletConnected
      ) {
        // Wallet changed - check if account exists
        handleWalletChange(walletAddress);
      } else if (
        !hasShownConnectionToast &&
        !isConnectingFromModal &&
        previousWalletConnected === false
      ) {
        // Initial connection (not from modal)
        hasShownConnectionToast = true;
      }
    } else if (!walletConnected && previousWalletConnected) {
      // Wallet disconnected
      handleWalletDisconnect();
    }

    previousWalletConnected = walletConnected;
    previousWalletAddress = walletAddress;
  }

  // Handle wallet change - check if account exists
  async function handleWalletChange(newWalletAddress: string) {
    if (!web3Data?.authenticate) {
      showToast(
        "error",
        "Authentication Error",
        "Authentication service is not available. Please try again."
      );
      return;
    }

    try {
      // Check if the new wallet account exists
      const authResult = await web3Data.authenticate(newWalletAddress);

      if (authResult?.success) {
        // Account exists and authenticated successfully
        showToast(
          "success",
          "Wallet Changed",
          `Successfully switched to ${newWalletAddress.slice(0, 6)}...${newWalletAddress.slice(-4)}`
        );
      } else if (authResult?.needsUsername) {
        // Account doesn't exist - disconnect wallet, redirect to home, and show toast
        if (walletData?.disconnect) {
          walletData.disconnect();
        }

        if (currentPath.startsWith("/dashboard")) {
          await goto("/");
        }

        showToast(
          "warning",
          "Account Not Found",
          "This wallet is not registered. Please connect with a registered wallet or create a new account."
        );
      } else {
        // Authentication failed for other reasons
        showToast(
          "error",
          "Authentication Failed",
          "Failed to authenticate the new wallet. Please try again."
        );
      }
    } catch (error) {
      console.error("Wallet change error:", error);
      showToast(
        "error",
        "Wallet Change Failed",
        "Failed to authenticate the new wallet. Please try again."
      );
    }
  }

  // Handle wallet disconnect
  async function handleWalletDisconnect() {
    // Reset flags
    hasShownConnectionToast = false;
    isConnectingFromModal = false;
    currentConnectionSession = null;

    try {
      // If on dashboard, redirect to home
      if (currentPath.startsWith("/dashboard")) {
        await goto("/");
      }

      // Show disconnect toast
      showToast(
        "info",
        "Wallet Disconnected",
        "Your wallet has been disconnected successfully."
      );
    } catch (error) {
      console.error("Wallet disconnect redirect error:", error);
      // Still show the disconnect toast even if redirect fails
      showToast(
        "info",
        "Wallet Disconnected",
        "Your wallet has been disconnected successfully."
      );
    }
  }

  async function handleWalletAction() {
    if (walletConnected) {
      walletData?.disconnect?.();
    } else {
      // If no wallets are detected, try to refresh the wallet list
      if (availableWallets.length === 0) {
        if (walletData?.refreshWallets) {
          walletData.refreshWallets();
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Try to connect wallet
      const result = await walletData?.connect?.();

      // If result is false and multiple wallets are available, show modal
      if (result === false && availableWallets.length > 1) {
        showWalletModal = true;
      } else if (result && typeof result === "object" && result.needsUsername) {
        // Wallet connected but needs username setup
        showUsernameModal = true;
      } else if (result === true && walletAddress) {
        // Wallet connected successfully, now authenticate with Web3
        await handleWeb3Authentication();
      }
    }
  }

  async function handleWeb3Authentication() {
    if (!walletAddress || !web3Data?.authenticate) {
      showToast(
        "error",
        "Authentication Error",
        "Authentication service is not available. Please try again."
      );
      return;
    }

    try {
      // Set flag to prevent connection toast during authentication
      hasShownConnectionToast = true;

      const authResult = await web3Data.authenticate(walletAddress);

      if (authResult?.needsUsername) {
        // Show username setup modal
        showUsernameModal = true;
      } else if (authResult?.success) {
        // Authentication successful - show success toast
        showToast(
          "success",
          "Authentication Successful!",
          "Your wallet has been authenticated and you're now logged in."
        );
      } else {
        // Authentication failed
        showToast(
          "error",
          "Authentication Failed",
          "Failed to authenticate your wallet. Please try again."
        );
      }
    } catch (error) {
      console.error("Web3 authentication error:", error);
      // Show error toast
      showToast(
        "error",
        "Authentication Failed",
        "Failed to authenticate your wallet. Please try again."
      );
    }
  }

  function handleUsernameSetup(event: CustomEvent) {
    const { username, displayName } = event.detail;

    if (walletAddress && web3Data?.authenticate) {
      try {
        web3Data.authenticate(walletAddress, username, displayName);

        // Show success toast for username setup
        showToast(
          "success",
          "Account Created!",
          `Welcome ${username}! Your account has been created successfully.`
        );
      } catch (error) {
        console.error("Username setup error:", error);
        showToast(
          "error",
          "Account Creation Failed",
          "Failed to create your account. Please try again."
        );
      }
    } else {
      showToast(
        "error",
        "Setup Error",
        "Unable to complete account setup. Please try again."
      );
    }

    showUsernameModal = false;
  }

  function handleUsernameCancel() {
    // Auto-disconnect wallet when user cancels username setup
    if (walletData?.disconnect) {
      walletData.disconnect();
    }

    showUsernameModal = false;
  }

  async function handleWalletSelection(event: CustomEvent) {
    const { wallet } = event.detail;
    showWalletModal = false;

    // Set flag to prevent duplicate toast from reactive statement
    isConnectingFromModal = true;

    try {
      const result = await walletData?.connectToSpecific?.(wallet);

      if (result && typeof result === "object" && result.needsUsername) {
        showUsernameModal = true;
      } else if (result === true) {
        // Show success toast for modal selection
        showToast(
          "success",
          "Wallet Connected!",
          `Successfully connected to ${wallet}`
        );
      } else {
        // Connection failed
        showToast(
          "error",
          "Connection Failed",
          `Failed to connect to ${wallet}. Please try again.`
        );
      }
    } catch (error) {
      console.error("Wallet selection error:", error);
      showToast(
        "error",
        "Connection Failed",
        `Failed to connect to ${wallet}. Please try again.`
      );
    }

    // Reset the flag after a short delay
    setTimeout(() => {
      isConnectingFromModal = false;
    }, 100);
  }
</script>

<div class="wallet-connect-button">
  {#if walletConnected}
    <!-- Connected State -->
    <div class="flex flex-col items-center">
      <button
        on:click={handleWalletAction}
        class="px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-red-500/25"
      >
        <div class="flex items-center space-x-1 md:space-x-2">
          <svg
            class="w-3 h-3 md:w-4 md:h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span class="text-xs md:text-sm"
            >{walletAddress
              ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
              : "Disconnect"}</span
          >
        </div>
      </button>
    </div>
  {:else}
    <!-- Disconnected State -->
    <div class="flex flex-col items-center">
      <button
        on:click={handleWalletAction}
        class="px-3 md:px-6 py-1.5 md:py-2.5 bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] hover:from-[#00F5FF]/90 hover:to-[#9D4EDD]/90 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-[#00F5FF]/25 flex items-center space-x-1 md:space-x-2"
      >
        <svg
          class="w-3 h-3 md:w-4 md:h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        <span class="text-xs md:text-sm">Connect</span>
      </button>

      <!-- Show error message if any -->
      {#if connectionError}
        <div
          class="mt-1 md:mt-2 px-2 md:px-3 py-0.5 md:py-1 bg-red-900/50 border border-red-500/30 rounded-lg"
        >
          <div class="text-xs text-red-400 max-w-xs text-center">
            {connectionError}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Wallet Selection Modal -->
<WalletSelectionModal
  bind:show={showWalletModal}
  {availableWallets}
  on:select={handleWalletSelection}
/>

<UsernameSetupModal
  bind:show={showUsernameModal}
  {walletAddress}
  isLoading={web3Data?.isLoading || false}
  on:submit={handleUsernameSetup}
  on:close={() => (showUsernameModal = false)}
  on:cancel={handleUsernameCancel}
/>

<style>
  .wallet-connect-button {
    /* Custom styling for the wallet button */
  }
</style>
