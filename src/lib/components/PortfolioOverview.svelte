<script lang="ts">
  // Placeholder data - in real app this would come from props
  let portfolioData = {
    totalValue: "12.45 ETH",
    assets: [
      { name: "Ethereum", value: "8.20 ETH", percentage: 65.8 },
      { name: "USDC", value: "2.50 ETH", percentage: 20.1 },
      { name: "Other", value: "1.75 ETH", percentage: 14.1 },
    ],
  };
</script>

<div class="space-y-4 md:space-y-6">
  <h2 class="text-lg md:text-xl font-bold text-white">Portfolio Overview</h2>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
    <!-- Asset Distribution Chart -->
    <div class="bg-gray-800 rounded-lg p-4 md:p-6 relative overflow-hidden">
      <!-- Glowing particles effect -->
      <div class="absolute inset-0 pointer-events-none">
        <div
          class="absolute top-4 left-4 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-30"
          style="animation-delay: 0s;"
        ></div>
        <div
          class="absolute bottom-4 right-4 w-1 h-1 bg-teal-400 rounded-full animate-pulse opacity-30"
          style="animation-delay: 1s;"
        ></div>
      </div>

      <div class="flex items-center justify-center h-32 md:h-48">
        <div class="text-center">
          <svg
            class="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-600 mb-3 md:mb-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
            />
          </svg>
          <p class="text-gray-400 text-xs md:text-sm">
            Asset Distribution Chart
          </p>
        </div>
      </div>
    </div>

    <!-- Value Over Time Chart -->
    <div class="bg-gray-800 rounded-lg p-4 md:p-6 relative overflow-hidden">
      <!-- Glowing particles effect -->
      <div class="absolute inset-0 pointer-events-none">
        <div
          class="absolute top-4 right-4 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-30"
          style="animation-delay: 0.5s;"
        ></div>
        <div
          class="absolute bottom-4 left-4 w-1 h-1 bg-teal-400 rounded-full animate-pulse opacity-30"
          style="animation-delay: 1.5s;"
        ></div>
      </div>

      <div class="flex items-center justify-center h-32 md:h-48">
        <div class="text-center">
          <svg
            class="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-600 mb-3 md:mb-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <p class="text-gray-400 text-xs md:text-sm">Value Over Time Chart</p>
        </div>
      </div>
    </div>
  </div>
</div>
