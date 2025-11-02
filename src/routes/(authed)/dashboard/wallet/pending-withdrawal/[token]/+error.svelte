<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  export let status: number;
  export let error: Error;

  $: errorMessage = error?.message || "An error occurred";
  $: isCancelledOrProcessed = status === 410 || status === 404;
  $: isExpired = status === 400;

  onMount(() => {
    // Auto-redirect after 3 seconds if withdrawal is cancelled/processed
    if (isCancelledOrProcessed) {
      setTimeout(() => {
        goto("/dashboard/wallet");
      }, 3000);
    }
  });
</script>

<svelte:head>
  <title>Withdrawal Error - SOS SEATS</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white px-4 py-6 sm:py-8 flex items-center justify-center">
  <div class="max-w-md w-full text-center">
    <div class="bg-gray-800 border border-gray-700 rounded-xl p-8">
      {#if status === 410}
        <!-- Cancelled or Processed -->
        <div class="mb-6">
          <svg
            class="w-16 h-16 text-yellow-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">
            Withdrawal {errorMessage.includes("cancelled") ? "Cancelled" : "Processed"}
          </h1>
          <p class="text-gray-400 text-sm sm:text-base">{errorMessage}</p>
        </div>
      {:else if status === 400}
        <!-- Expired -->
        <div class="mb-6">
          <svg
            class="w-16 h-16 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">Withdrawal Expired</h1>
          <p class="text-gray-400 text-sm sm:text-base">{errorMessage}</p>
        </div>
      {:else}
        <!-- Other Errors -->
        <div class="mb-6">
          <svg
            class="w-16 h-16 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">Error Loading Withdrawal</h1>
          <p class="text-gray-400 text-sm sm:text-base">{errorMessage}</p>
        </div>
      {/if}

      <div class="space-y-4">
        <button
          on:click={() => goto("/dashboard/wallet")}
          class="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg text-sm sm:text-base font-semibold transition-all"
        >
          Back to Wallet
        </button>

        {#if isCancelledOrProcessed}
          <p class="text-gray-500 text-xs">Redirecting to wallet page in 3 seconds...</p>
        {/if}
      </div>
    </div>
  </div>
</div>
