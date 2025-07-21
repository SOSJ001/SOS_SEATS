<script lang="ts">
  import { walletStore } from "$lib/store.js";
  import WalletSelectionModal from "./WalletSelectionModal.svelte";

  let walletConnected = false;
  let walletAddress = "";
  let availableWallets: string[] = [];
  let connectionError = "";
  let showWalletModal = false;
  let walletData: any = null;

  // Subscribe to wallet store
  walletStore.subscribe((data) => {
    walletData = data;
    walletConnected = data.connected || false;
    walletAddress = data.address || "";
    availableWallets = data.available || [];
    connectionError = data.error || "";
  });

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
      }
    }
  }

  function handleWalletSelection(event: CustomEvent) {
    const { wallet } = event.detail;
    walletData?.connectToSpecific?.(wallet);
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
          <span class="text-xs md:text-sm">Disconnect</span>
        </div>
      </button>
      {#if walletAddress}
        <div
          class="mt-1 md:mt-2 px-2 md:px-3 py-0.5 md:py-1 bg-gradient-to-r from-[#18122B] to-[#232946] border border-[#00F5FF]/30 rounded-lg"
        >
          <div class="text-xs text-[#00F5FF] font-medium">
            {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
          </div>
        </div>
      {/if}
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
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
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

<style>
  .wallet-connect-button {
    /* Custom styling for the wallet button */
  }
</style>
