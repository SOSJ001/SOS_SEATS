<script lang="ts">
  import { walletStore, web3UserStore, showToast } from "$lib/store";
  import WalletSelectionModal from "./WalletSelectionModal.svelte";
  import UsernameSetupModal from "./UsernameSetupModal.svelte";

  let walletConnected = false;
  let walletAddress = "";
  let availableWallets: string[] = [];
  let connectionError = "";
  let showWalletModal = false;
  let showUsernameModal = false;
  let walletData: any = null;
  let web3Data: any = null;

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
  let hasShownConnectionToast = false;
  let isConnectingFromModal = false;
  let currentConnectionSession = null;

  // Watch for wallet connection changes and show appropriate toasts
  $: if (walletConnected !== previousWalletConnected) {
    if (
      walletConnected &&
      walletAddress &&
      !hasShownConnectionToast &&
      !isConnectingFromModal
    ) {
      // Create a unique session ID for this connection
      currentConnectionSession = Date.now();

      // Wallet just connected successfully (but not from modal selection)
      showToast(
        "success",
        "Wallet Connected!",
        `Successfully connected to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      );
      hasShownConnectionToast = true;
    } else if (!walletConnected) {
      // Reset the flag when wallet disconnects
      hasShownConnectionToast = false;
      isConnectingFromModal = false;
      currentConnectionSession = null;
    }
    previousWalletConnected = walletConnected;
  }

  async function handleWalletAction() {
    if (walletConnected) {
      // Show disconnect toast before disconnecting
      showToast(
        "info",
        "Wallet Disconnected",
        "Your wallet has been disconnected successfully."
      );

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
    if (!walletAddress || !web3Data?.authenticate) return;

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
      }
    } catch (error) {
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
      web3Data.authenticate(walletAddress, username, displayName);

      // Show success toast for username setup
      showToast(
        "success",
        "Account Created!",
        `Welcome ${username}! Your account has been created successfully.`
      );
    }

    showUsernameModal = false;
  }

  function handleUsernameCancel() {
    // Auto-disconnect wallet when user cancels username setup
    if (walletData?.disconnect) {
      walletData.disconnect();
    }

    // Show toast notification
    showToast(
      "info",
      "Wallet Disconnected",
      "Wallet was disconnected because username setup was cancelled. Please complete the setup to use your wallet."
    );

    showUsernameModal = false;
  }

  async function handleWalletSelection(event: CustomEvent) {
    const { wallet } = event.detail;
    showWalletModal = false;

    // Set flag to prevent duplicate toast from reactive statement
    isConnectingFromModal = true;

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
