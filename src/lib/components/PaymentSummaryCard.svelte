<script>
  export let totalPrice = 0;
  export let currency = "NLe";
  export let pricePerTicket = 0.01;
  export let platformFee = 0; // Platform fee for mobile money
  export let showFeeBreakdown = false; // Show fee breakdown for mobile money
</script>

<div class="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
  <!-- Price Breakdown (for mobile money with fees) -->
  {#if showFeeBreakdown && platformFee > 0}
    <div class="mb-4 space-y-2">
      <div class="flex items-center justify-between text-gray-300">
        <span class="text-sm">Ticket Price:</span>
        <span class="text-sm font-medium"
          >{currency} {(totalPrice - platformFee).toFixed(2)}</span
        >
      </div>
      <div class="flex items-center justify-between text-gray-300">
        <span class="text-sm">Service Fee:</span>
        <span class="text-sm font-medium"
          >{currency} {platformFee.toFixed(2)}</span
        >
      </div>
      <div class="border-t border-gray-600 pt-2 mt-2"></div>
    </div>
  {/if}

  <!-- Total Price Display -->
  <div class="flex items-center justify-between mb-6">
    <span class="text-xl font-semibold text-white">Total:</span>
    <span class="text-2xl font-bold text-white"
      >{currency === "SOL" || currency === "USDC"
        ? `${totalPrice} ${currency}`
        : `${currency} ${totalPrice.toFixed(2)}`}</span
    >
  </div>

  <!-- Payment Button Slot -->
  <slot />
</div>
