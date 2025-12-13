<script lang="ts">
  export let quantity = 0;
  export let availableQuantity = 999; // Default high number
  export let onQuantityChange = (newQuantity: number) => {};

  function increment() {
    if (quantity >= availableQuantity) return;
    const newQuantity = quantity + 1;
    onQuantityChange(newQuantity);
  }

  function decrement() {
    const newQuantity = Math.max(0, quantity - 1);
    onQuantityChange(newQuantity);
  }
</script>

<div class="flex flex-col items-center gap-2">
  <!-- Buttons and Quantity Row -->
  <div class="flex items-center gap-2">
    <!-- Decrement Button -->
    <button
      on:click={decrement}
      disabled={quantity <= 0}
      class="w-9 h-9 sm:w-10 sm:h-10 bg-gray-700 text-white rounded-lg flex items-center justify-center hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
    >
      <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20 12H4"
        ></path>
      </svg>
    </button>

    <!-- Quantity Display -->
    <div
      class="w-11 h-9 sm:w-12 sm:h-10 bg-gray-700 text-white rounded-lg flex items-center justify-center font-semibold text-sm sm:text-base"
    >
      {quantity}
    </div>

    <!-- Increment Button -->
    <button
      on:click={increment}
      disabled={quantity >= availableQuantity || availableQuantity <= 0}
      class="w-9 h-9 sm:w-10 sm:h-10 bg-gray-700 text-white rounded-lg flex items-center justify-center hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
    >
      <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 4v16m8-8H4"
        ></path>
      </svg>
    </button>
  </div>

  <!-- Available Quantity Display -->
  {#if availableQuantity <= 0}
    <div class="text-red-400 text-xs sm:text-sm mt-1 text-center">Sold Out</div>
  {:else if availableQuantity < 10}
    <div class="text-yellow-400 text-xs sm:text-sm mt-1 text-center">Only {availableQuantity} left!</div>
  {:else}
    <div class="text-gray-400 text-xs sm:text-sm mt-1 text-center">{availableQuantity} available</div>
  {/if}
</div>
