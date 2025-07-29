<script>
  export let quantity = 0;
  export let onQuantityChange = (newQuantity) => {};

  function increment() {
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
    class="w-10 h-10 bg-gray-700 text-white rounded-lg flex items-center justify-center hover:bg-gray-600 transition-all duration-200"
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
