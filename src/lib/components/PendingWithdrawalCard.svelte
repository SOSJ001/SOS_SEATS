<script lang="ts">
  import { goto } from "$app/navigation";

  export let withdrawal: {
    id: string;
    amount: number;
    currency: string;
    wallet_address: string;
    created_at: string;
    expires_at: string;
    required_signatures: number;
    collected_signatures: Array<{
      wallet: string;
      signature: string;
      public_key: string;
      signed_at: string;
    }>;
    metadata: any;
    pending_token: string;
  };

  $: signatureCount = withdrawal.collected_signatures?.length || 0;
  $: progressPercentage = withdrawal.required_signatures > 0
    ? (signatureCount / withdrawal.required_signatures) * 100
    : 0;
  $: remainingSignatures = withdrawal.required_signatures - signatureCount;
  $: isExpired = withdrawal.expires_at ? new Date(withdrawal.expires_at) < new Date() : false;
  $: timeRemaining = getTimeRemaining(withdrawal.expires_at);

  function getTimeRemaining(expiresAt: string | null): string {
    if (!expiresAt) return "No expiry";
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";
    if (diff < 60 * 1000) return `${Math.floor(diff / 1000)}s remaining`;
    if (diff < 60 * 60 * 1000)
      return `${Math.floor(diff / (60 * 1000))}m remaining`;
    if (diff < 24 * 60 * 60 * 1000)
      return `${Math.floor(diff / (60 * 60 * 1000))}h remaining`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d remaining`;
  }

  function formatWalletAddress(address: string): string {
    if (!address) return "";
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function handleViewDetails() {
    if (withdrawal.pending_token) {
      goto(`/dashboard/wallet/pending-withdrawal/${withdrawal.pending_token}`);
    }
  }
</script>

<div
  class="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 hover:border-purple-500/50 transition-all"
>
  <!-- Header -->
  <div class="flex items-start justify-between mb-4">
    <div class="flex items-start gap-3 flex-1 min-w-0">
      <!-- Icon -->
      <div
        class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0"
      >
        <svg
          class="w-5 h-5 sm:w-6 sm:h-6 text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <!-- Title and Amount -->
      <div class="flex-1 min-w-0">
        <h3 class="text-white font-semibold text-sm sm:text-base mb-1">
          Multi-Signature Withdrawal
        </h3>
        <div class="text-lg sm:text-xl font-bold text-cyan-400">
          {Math.abs(withdrawal.amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          {withdrawal.currency || "NLe"}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          {new Date(withdrawal.created_at).toLocaleString()}
        </div>
      </div>
    </div>

    <!-- Status Badge -->
    <div class="flex flex-col items-end gap-2">
      {#if isExpired}
        <span
          class="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full font-medium"
        >
          EXPIRED
        </span>
      {:else if signatureCount >= withdrawal.required_signatures}
        <span
          class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium"
        >
          READY
        </span>
      {:else}
        <span
          class="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium"
        >
          PENDING
        </span>
      {/if}
      {#if withdrawal.expires_at && !isExpired}
        <span class="text-xs text-gray-500">{timeRemaining}</span>
      {/if}
    </div>
  </div>

  <!-- Signature Progress -->
  <div class="mb-4">
    <div class="flex items-center justify-between text-sm mb-2">
      <span class="text-gray-300">Signatures</span>
      <span class="text-gray-400"
        >{signatureCount} / {withdrawal.required_signatures}</span
      >
    </div>

    <!-- Progress Bar -->
    <div class="w-full bg-gray-700 rounded-full h-2 mb-3">
      <div
        class="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
        style="width: {progressPercentage}%"
      ></div>
    </div>

    <!-- Signers List -->
    {#if withdrawal.collected_signatures && withdrawal.collected_signatures.length > 0}
      <div class="space-y-1">
        <div class="text-xs text-gray-400 mb-1">Signed by:</div>
        {#each withdrawal.collected_signatures as signature (signature.wallet)}
          <div
            class="flex items-center gap-2 text-xs text-gray-300 bg-gray-700/50 rounded px-2 py-1"
          >
            <svg
              class="w-3 h-3 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="font-mono">{formatWalletAddress(signature.wallet)}</span>
            <span class="text-gray-500 ml-auto text-[10px]">
              {new Date(signature.signed_at).toLocaleTimeString()}
            </span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-xs text-gray-500 text-center py-2">
        No signatures collected yet
      </div>
    {/if}
  </div>

  <!-- Phone Number Info (if available) -->
  {#if withdrawal.metadata?.phone_number}
    <div class="mb-4 p-3 bg-gray-700/50 rounded-lg">
      <div class="text-xs text-gray-400 mb-1">Destination</div>
      <div class="text-sm text-white font-medium">
        {withdrawal.metadata.phone_number}
      </div>
      {#if withdrawal.metadata.provider}
        <div class="text-xs text-gray-500 mt-1">
          {withdrawal.metadata.provider === "orange_money"
            ? "Orange Money"
            : withdrawal.metadata.provider === "afrimoney"
              ? "Afrimoney"
              : withdrawal.metadata.provider}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Action Button -->
  <div class="pt-3 border-t border-gray-700">
    <button
      on:click={handleViewDetails}
      class="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
    >
      <span>View Details</span>
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  </div>

  {#if remainingSignatures > 0 && !isExpired}
    <div class="mt-2 text-center text-xs text-gray-400">
      {remainingSignatures} more signature{remainingSignatures > 1 ? "s" : ""} needed
    </div>
  {/if}
</div>

