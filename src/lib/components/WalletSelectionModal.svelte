<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade, scale } from "svelte/transition";

  export let show = false;
  export let availableWallets: string[] = [];

  const dispatch = createEventDispatcher();

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
              <!-- Wallet icon -->
              <div class="flex-shrink-0">
                {#if wallet === "Phantom"}
                  <div
                    class="w-8 h-8 bg-gradient-to-br from-[#9D4EDD] to-[#9D4EDD]/80 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                  >
                    <svg
                      class="w-5 h-5 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      />
                    </svg>
                  </div>
                {:else if wallet === "Brave"}
                  <div
                    class="w-8 h-8 bg-gradient-to-br from-[#FF6B00] to-[#FF8C3A] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                  >
                    <svg
                      class="w-5 h-5 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M12 2l4 2 4 3-2 11-6 4-6-4L4 7l4-3 4-2zm0 3.2L9.2 6.5 6.7 8.3 8 16l4 2.6 4-2.6 1.3-7.7-2.5-1.8L12 5.2z"
                      />
                    </svg>
                  </div>
                {:else if wallet === "Solflare"}
                  <div
                    class="w-8 h-8 bg-gradient-to-br from-[#FF6B6B] to-[#FF6B6B]/80 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                  >
                    <svg
                      class="w-5 h-5 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                      />
                    </svg>
                  </div>
                {:else if wallet === "Backpack"}
                  <div
                    class="w-8 h-8 bg-gradient-to-br from-[#00F5FF] to-[#00F5FF]/80 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                  >
                    <svg
                      class="w-5 h-5 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M19 7h-3V6c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v1H5c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 6h4v1h-4V6z"
                      />
                    </svg>
                  </div>
                {:else}
                  <div
                    class="w-8 h-8 bg-gradient-to-br from-[#FFD700] to-[#FFD700]/80 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                  >
                    <svg
                      class="w-5 h-5 text-gray-900"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                      />
                    </svg>
                  </div>
                {/if}
              </div>

              <!-- Wallet name -->
              <span
                class="font-medium text-gray-200 group-hover:text-white transition-colors duration-200"
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
