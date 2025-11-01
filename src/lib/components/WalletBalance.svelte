<script lang="ts">
  export let balance: string = "12.45 ETH";
  export let onSend: () => void = () => {};
  export let onReceive: () => void = () => {};
  export let onSwap: () => void = () => {};
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
        <span class="text-2xl md:text-3xl font-bold text-cyan-400">Loading...</span>
      </div>
    {:else}
      <h2 class="text-3xl md:text-4xl font-bold text-cyan-400 mb-4 md:mb-6">
        {balance}
      </h2>
    {/if}
  </div>

  <!-- Action Buttons -->
  <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
    <!-- Send Button -->
    <button
      on:click={onSend}
      class="flex-1 flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <svg
        class="w-4 h-4 md:w-5 md:h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
        />
      </svg>
      <span class="text-sm md:text-base">Send</span>
    </button>

    <!-- Receive Button -->
    <button
      on:click={onReceive}
      class="flex-1 flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <svg
        class="w-4 h-4 md:w-5 md:h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
      <span class="text-sm md:text-base">Receive</span>
    </button>

    <!-- Swap Button -->
    <button
      on:click={onSwap}
      class="flex-1 flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <svg
        class="w-4 h-4 md:w-5 md:h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
          clip-rule="evenodd"
        />
      </svg>
      <span class="text-sm md:text-base">Swap</span>
    </button>
  </div>
</div>
