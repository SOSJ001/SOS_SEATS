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

<div class="flex items-center gap-2">
  <!-- Decrement Button -->
  <button
    on:click={decrement}
    disabled={quantity <= 0}
    class="w-10 h-10 bg-gray-700 text-white rounded-lg flex items-center justify-center hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
  >
    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    class="w-12 h-10 bg-gray-700 text-white rounded-lg flex items-center justify-center font-semibold"
  >
    {quantity}
  </div>

  <!-- Increment Button -->
  <button
    on:click={increment}
    disabled={quantity >= availableQuantity || availableQuantity <= 0}
    class="w-10 h-10 bg-gray-700 text-white rounded-lg flex items-center justify-center hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
  >
    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  <div class="text-red-400 text-sm mt-1">Sold Out</div>
{:else if availableQuantity < 10}
  <div class="text-yellow-400 text-sm mt-1">Only {availableQuantity} left!</div>
{:else}
  <div class="text-gray-400 text-sm mt-1">{availableQuantity} available</div>
{/if}
