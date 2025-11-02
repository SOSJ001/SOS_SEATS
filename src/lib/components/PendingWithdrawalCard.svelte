<script lang="ts">
  import { goto } from "$app/navigation";

  export let withdrawal: any;

  function formatAddress(address: string): string {
    if (!address) return "";
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }

  function formatCurrency(amount: number, currency: string): string {
    return `${currency} ${Math.abs(amount).toFixed(2)}`;
  }

  function getCollectedSignaturesCount(): number {
    if (!withdrawal.collected_signatures || !Array.isArray(withdrawal.collected_signatures)) {
      return 0;
    }
    return withdrawal.collected_signatures.length;
  }

  function getSignatureProgress(): number {
    const collected = getCollectedSignaturesCount();
    const required = withdrawal.required_signatures || 1;
    return Math.min((collected / required) * 100, 100);
  }

  function handleViewDetails() {
    if (withdrawal.pending_token) {
      goto(`/dashboard/wallet/pending-withdrawal/${withdrawal.pending_token}`);
    }
  }

  function getTimeRemaining(): string {
    if (!withdrawal.expires_at) return "No expiry";
    const expires = new Date(withdrawal.expires_at);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  }

  const metadata = withdrawal.metadata || {};
  const phoneNumber = metadata.phone_number || "N/A";
  const provider = metadata.provider || "orange_money";
  const finalAmount = metadata.final_net_amount || Math.abs(withdrawal.amount);
  const currency = withdrawal.currency || "NLe";
  const progress = getSignatureProgress();
  const collectedCount = getCollectedSignaturesCount();
  const requiredCount = withdrawal.required_signatures || 1;
  const remainingCount = Math.max(0, requiredCount - collectedCount);
</script>

<div class="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-5 hover:border-purple-500 transition-colors">
  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
    <div class="flex-1">
      <h3 class="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">Pending Withdrawal</h3>
      <p class="text-gray-400 text-xs sm:text-sm font-mono mb-1">{formatCurrency(finalAmount, currency)}</p>
      <p class="text-gray-400 text-xs sm:text-sm">To: {phoneNumber}</p>
      <p class="text-gray-400 text-xs sm:text-sm capitalize">Provider: {provider.replace("_", " ")}</p>
    </div>
    <div class="text-right">
      <span class="inline-block px-2 py-1 bg-yellow-900/30 border border-yellow-700 text-yellow-300 text-xs sm:text-sm rounded">
        Pending Approval
      </span>
    </div>
  </div>

  <!-- Signature Progress -->
  <div class="mb-3 sm:mb-4">
    <div class="flex items-center justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
      <span class="text-gray-400">Signatures</span>
      <span class="text-white font-semibold">{collectedCount} / {requiredCount}</span>
    </div>
    <div class="w-full bg-gray-700 rounded-full h-2 sm:h-2.5">
      <div
        class="bg-gradient-to-r from-purple-600 to-purple-700 h-2 sm:h-2.5 rounded-full transition-all duration-300"
        style="width: {progress}%"
      ></div>
    </div>
    {#if remainingCount > 0}
      <p class="text-gray-400 text-xs mt-1.5 sm:mt-2">Waiting for {remainingCount} more signature{remainingCount !== 1 ? 's' : ''}</p>
    {:else}
      <p class="text-green-400 text-xs mt-1.5 sm:mt-2">Ready to execute</p>
    {/if}
  </div>

  <!-- Time Remaining -->
  <div class="mb-3 sm:mb-4">
    <div class="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
      <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>{getTimeRemaining()}</span>
    </div>
  </div>

  <!-- Action Button -->
  <button
    on:click={handleViewDetails}
    class="w-full px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2"
  >
    <span>View Details</span>
    <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
    </svg>
  </button>
</div>

