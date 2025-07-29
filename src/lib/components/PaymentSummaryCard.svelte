<script>
  export let totalPrice = 0;
</script>

<div class="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
  <!-- Total Price Display -->
  <div class="flex items-center justify-between mb-6">
    <span class="text-xl font-semibold text-white">Total:</span>
    <span class="text-2xl font-bold text-white"
      >NLe {totalPrice.toFixed(2)}</span
    >
  </div>

  <!-- Payment Button Slot -->
  <slot />
</div>
