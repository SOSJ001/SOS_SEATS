<script lang="ts">
  export let balance: string = "12.45 ETH";
  export let isLoading: boolean = false;
</script>

<div class="bg-gray-800 rounded-lg p-4 md:p-6 relative overflow-hidden">
  <!-- Glowing particles effect -->
  <div class="absolute inset-0 pointer-events-none">
    <div
      class="absolute top-4 left-4 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-60"
      style="animation-delay: 0s;"
    ></div>
    <div
      class="absolute top-8 right-8 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-60"
      style="animation-delay: 0.5s;"
    ></div>
    <div
      class="absolute bottom-8 left-8 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse opacity-60"
      style="animation-delay: 1s;"
    ></div>
    <div
      class="absolute bottom-4 right-4 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-60"
      style="animation-delay: 1.5s;"
    ></div>
  </div>

  <!-- Balance Display -->
  <div class="text-center mb-4 md:mb-6">
    <p class="text-gray-400 text-xs md:text-sm font-medium mb-2">
      CURRENT BALANCE
    </p>
    {#if isLoading}
      <div class="flex items-center justify-center gap-3 mb-4 md:mb-6">
        <svg
          class="animate-spin h-8 w-8 text-cyan-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
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
        <span class="text-2xl md:text-3xl font-bold text-cyan-400"
          >Loading...</span
        >
      </div>
    {:else}
      <h2 class="text-3xl md:text-4xl font-bold text-cyan-400 mb-4 md:mb-6">
        {balance}
      </h2>
    {/if}
  </div>
</div>
