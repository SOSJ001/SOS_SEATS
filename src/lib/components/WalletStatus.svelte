<script lang="ts">
  import { getContext } from "svelte";
  import { onMount } from "svelte";

  let walletInfo = {
    connected: false,
    publicKey: null,
    balance: 0,
  };

  // Get wallet context from parent
  const walletContext = getContext("wallet");

  onMount(() => {
    // Subscribe to wallet context changes
    $: if (walletContext) {
      walletInfo = {
        connected: walletContext.connected,
        publicKey: walletContext.address,
        balance: 0, // You can fetch balance here if needed
      };
    }
  });
</script>

<div class="wallet-status">
  {#if walletInfo.connected}
    <div class="flex items-center space-x-2 text-green-400">
      <div class="w-2 h-2 bg-green-400 rounded-full"></div>
      <span class="text-sm font-medium">Connected</span>
    </div>
    {#if walletInfo.publicKey}
      <div class="text-xs text-gray-400 mt-1">
        {walletInfo.publicKey.slice(0, 4)}...{walletInfo.publicKey.slice(-4)}
      </div>
    {/if}
  {:else}
    <div class="flex items-center space-x-2 text-gray-400">
      <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
      <span class="text-sm font-medium">Not Connected</span>
    </div>
  {/if}
</div>

<style>
  .wallet-status {
    padding: 0.5rem;
    border-radius: 0.375rem;
    background-color: rgba(55, 65, 81, 0.5);
  }
</style>
