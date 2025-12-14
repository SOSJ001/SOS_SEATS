<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade, scale } from "svelte/transition";

  export let show = false;
  export let availableWallets: string[] = [];

  const dispatch = createEventDispatcher();

  // ============================================================================
  // WALLET LOGO MAPPING
  // ============================================================================
  // Maps wallet names to their logo image paths in the static directory.
  // The actual logo files provided are:
  // - /Phantom-Icon_App_60x60.png (Phantom wallet)
  // - /brave.png (Brave wallet)
  // - /backpack.png (Backpack wallet)
  // - /solflare.png (Solflare wallet - add this file to static directory)
  // ============================================================================

  /**
   * Wallet logo paths mapping
   *
   * Maps wallet names to their logo file paths in the static directory.
   * These are the actual wallet logo images provided.
   *
   * Supported formats: .png, .svg, .jpg, .webp
   */
  const walletLogos: Record<string, string> = {
    Phantom: "/Phantom-Icon_App_60x60.png", // Phantom wallet logo (ghost icon)
    Brave: "/brave.png", // Brave wallet logo (lion head)
    Solflare: "/solflare.png", // Solflare wallet logo
    Backpack: "/backpack.png", // Backpack wallet logo (red backpack icon)
  };

  /**
   * Get wallet logo path
   *
   * Returns the logo path for a given wallet name, or null if not found.
   *
   * @param walletName - The name of the wallet (e.g., "Phantom", "Brave")
   * @returns Logo path string or null
   */
  function getWalletLogo(walletName: string): string | null {
    return walletLogos[walletName] || null;
  }

  function selectWallet(walletName: string) {
    dispatch("select", { wallet: walletName });
    show = false;
  }

  function closeModal() {
    show = false;
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }
</script>

{#if show}
  <!-- Backdrop -->
  <button
    type="button"
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === "Escape" && closeModal()}
    aria-label="Close modal"
    transition:fade={{ duration: 200 }}
  >
    <!-- Modal Content -->
    <div
      class="relative w-full max-w-md"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      <!-- Background gradient matching project theme -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] rounded-xl border border-[#00F5FF]/20"
      ></div>

      <!-- Close button -->
      <button
        on:click={closeModal}
        class="absolute top-4 right-4 z-20 w-8 h-8 bg-gray-800/50 hover:bg-gray-700/70 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 group"
      >
        <svg
          class="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- Main content -->
      <div class="relative z-10 text-center p-6">
        <!-- Title with project's signature gradient -->
        <h3
          class="text-2xl font-bold mb-2 bg-gradient-to-r from-[#00F5FF] via-[#9D4EDD] to-[#FF6B6B] bg-clip-text text-transparent drop-shadow-lg"
        >
          Connect Your Wallet
        </h3>

        <!-- Subtitle -->
        <p class="text-gray-300 text-sm mb-6">
          Choose your preferred wallet to securely connect to your account.
        </p>

        <!-- Wallet buttons -->
        <div class="space-y-3">
          {#each availableWallets as wallet}
            <button
              on:click={() => selectWallet(wallet)}
              class="w-full p-4 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#00F5FF]/30 rounded-xl hover:border-[#00F5FF]/60 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3 group"
            >
              <!-- Wallet icon - Fixed width container for consistent alignment -->
              <div
                class="flex-shrink-0 w-10 h-10 flex items-center justify-center"
              >
                {#if getWalletLogo(wallet)}
                  <!-- Use actual wallet logo image -->
                  <img
                    src={getWalletLogo(wallet)}
                    alt="{wallet} Logo"
                    class="w-10 h-10 object-contain rounded-lg group-hover:scale-110 transition-transform duration-200"
                  />
                {:else}
                  <!-- Default/Unknown Wallet Icon - Generic wallet icon -->
                  <div
                    class="w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg shadow-yellow-500/20"
                  >
                    <svg
                      class="w-6 h-6 text-gray-900"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                {/if}
              </div>

              <!-- Wallet name -->
              <span
                class="font-medium text-gray-200 group-hover:text-white transition-colors duration-200 flex-shrink-0"
              >
                {wallet}
              </span>
            </button>
          {/each}
        </div>

        <!-- No wallets message -->
        {#if availableWallets.length === 0}
          <div class="text-gray-300 py-6">
            <div
              class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#00F5FF]/30 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-[#00F5FF]"
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
            </div>
            <p class="text-gray-200 font-medium mb-2">No wallets detected</p>
            <p class="text-sm text-gray-400">
              Please install a Solana wallet like Phantom, Brave, Solflare, or
              Backpack.
            </p>
          </div>
        {/if}

        <!-- Back link -->
        <button
          on:click={closeModal}
          class="mt-6 text-sm text-gray-400 hover:text-[#00F5FF] transition-colors duration-200"
        >
          Back to options
        </button>
      </div>
    </div>
  </button>
{/if}
