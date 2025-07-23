<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade, scale } from "svelte/transition";

  export let show = false;
  export let walletAddress = "";
  export let isLoading = false;

  const dispatch = createEventDispatcher();

  let username = "";
  let displayName = "";
  let error = "";
  let isSubmitting = false;

  function handleSubmit() {
    if (!username.trim()) {
      error = "Username is required";
      return;
    }

    if (username.length < 3) {
      error = "Username must be at least 3 characters";
      return;
    }

    if (username.length > 20) {
      error = "Username must be less than 20 characters";
      return;
    }

    // Only allow alphanumeric and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      error = "Username can only contain letters, numbers, and underscores";
      return;
    }

    error = "";
    isSubmitting = true;

    dispatch("submit", {
      username: username.trim(),
      displayName: displayName.trim() || username.trim(),
    });
  }

  function handleClose() {
    if (!isSubmitting) {
      show = false;
      username = "";
      displayName = "";
      error = "";
      dispatch("close");
      // Dispatch cancel event to notify parent that user closed without submitting
      dispatch("cancel");
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && !isSubmitting) {
      handleClose();
    }
  }

  // Reset form when modal opens
  $: if (show) {
    username = "";
    displayName = "";
    error = "";
    isSubmitting = false;
  }
</script>

{#if show}
  <button
    type="button"
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
    aria-label="Close modal"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="relative w-full max-w-md"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      <div
        class="absolute inset-0 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] rounded-xl border border-[#00F5FF]/20"
      ></div>

      <button
        on:click={handleClose}
        disabled={isSubmitting}
        class="absolute top-4 right-4 z-20 w-8 h-8 bg-gray-800/50 hover:bg-gray-700/70 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 group disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div class="relative z-10 p-6">
        <h3
          class="text-2xl font-bold mb-2 bg-gradient-to-r from-[#00F5FF] via-[#9D4EDD] to-[#FF6B6B] bg-clip-text text-transparent drop-shadow-lg"
        >
          Welcome to SOS SEATS!
        </h3>

        <p class="text-gray-300 text-sm mb-6">
          Set up your profile to complete your account creation.
        </p>

        <div class="space-y-4">
          <!-- Wallet Address Display -->
          <div
            class="p-3 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#00F5FF]/30 rounded-lg"
          >
            <div class="text-xs text-gray-400 mb-1">Connected Wallet</div>
            <div class="text-sm text-[#00F5FF] font-mono">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
          </div>

          <!-- Username Input -->
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-gray-300 mb-2"
            >
              Username <span class="text-red-400">*</span>
            </label>
            <input
              id="username"
              type="text"
              bind:value={username}
              disabled={isSubmitting}
              placeholder="Enter your username"
              class="w-full px-4 py-3 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#00F5FF]/30 rounded-lg text-white placeholder-gray-400 focus:border-[#00F5FF]/60 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div class="text-xs text-gray-400 mt-1">
              3-20 characters, letters, numbers, and underscores only
            </div>
          </div>

          <!-- Display Name Input -->
          <div>
            <label
              for="displayName"
              class="block text-sm font-medium text-gray-300 mb-2"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              bind:value={displayName}
              disabled={isSubmitting}
              placeholder="Enter your display name (optional)"
              class="w-full px-4 py-3 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#00F5FF]/30 rounded-lg text-white placeholder-gray-400 focus:border-[#00F5FF]/60 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <!-- Error Message -->
          {#if error}
            <div class="p-3 bg-red-900/50 border border-red-500/30 rounded-lg">
              <div class="text-sm text-red-400">
                {error}
              </div>
            </div>
          {/if}

          <!-- Submit Button -->
          <button
            on:click={handleSubmit}
            disabled={isSubmitting || isLoading}
            class="w-full py-3 bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] hover:from-[#00F5FF]/90 hover:to-[#9D4EDD]/90 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-[#00F5FF]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center space-x-2"
          >
            {#if isSubmitting || isLoading}
              <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Creating Account...</span>
            {:else}
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Create Account</span>
            {/if}
          </button>
        </div>

        <div class="mt-6 text-center">
          <p class="text-xs text-gray-400">
            By creating an account, you agree to our Terms of Service and
            Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  </button>
{/if}
