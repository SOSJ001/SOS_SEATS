<script lang="ts">
  import { walletStore, web3UserStore } from "$lib/store";

  // Subscribe to stores
  $: wallet = $walletStore;
  $: web3User = $web3UserStore;
</script>

<div class="wallet-status p-4 bg-gray-800 rounded-lg text-white">
  <h3 class="text-lg font-semibold mb-4">🔗 Wallet & Session Status</h3>

  <!-- Wallet Connection Status -->
  <div class="mb-4">
    <h4 class="font-medium mb-2">Wallet Connection:</h4>
    <div class="flex items-center space-x-2">
      <div
        class="w-3 h-3 rounded-full {wallet.connected
          ? 'bg-green-500'
          : 'bg-red-500'}"
      ></div>
      <span>{wallet.connected ? "Connected" : "Disconnected"}</span>
    </div>
    {#if wallet.connected}
      <div class="text-sm text-gray-300 mt-1">
        <div>
          Address: {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
        </div>
        <div>Wallet: {wallet.selectedWallet}</div>
      </div>
    {/if}
  </div>

  <!-- Web3 Authentication Status -->
  <div class="mb-4">
    <h4 class="font-medium mb-2">Web3 Authentication:</h4>
    <div class="flex items-center space-x-2">
      <div
        class="w-3 h-3 rounded-full {web3User.isAuthenticated
          ? 'bg-green-500'
          : 'bg-red-500'}"
      ></div>
      <span
        >{web3User.isAuthenticated
          ? "Authenticated"
          : "Not Authenticated"}</span
      >
    </div>
    {#if web3User.isAuthenticated && web3User.user}
      <div class="text-sm text-gray-300 mt-1">
        <div>User ID: {web3User.user.id}</div>
        <div>Username: {web3User.user.username || "N/A"}</div>
      </div>
    {/if}
  </div>

  <!-- Session Sync Status -->
  <div class="mb-4">
    <h4 class="font-medium mb-2">Session Sync:</h4>
    <div class="text-sm text-gray-300">
      {#if wallet.connected && web3User.isAuthenticated}
        <div class="text-green-400">✅ Wallet and session are in sync</div>
      {:else if !wallet.connected && !web3User.isAuthenticated}
        <div class="text-gray-400">ℹ️ No wallet connected, no session</div>
      {:else if !wallet.connected && web3User.isAuthenticated}
        <div class="text-yellow-400">
          ⚠️ Session exists but wallet disconnected (will auto-clear)
        </div>
      {:else if wallet.connected && !web3User.isAuthenticated}
        <div class="text-blue-400">
          🔗 Wallet connected but not authenticated
        </div>
      {/if}
    </div>
  </div>

  <!-- Available Wallets -->
  <div class="mb-4">
    <h4 class="font-medium mb-2">Available Wallets:</h4>
    <div class="text-sm text-gray-300">
      {#if wallet.available.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each wallet.available as walletName}
            <span class="px-2 py-1 bg-blue-600 rounded text-xs"
              >{walletName}</span
            >
          {/each}
        </div>
      {:else}
        <div class="text-red-400">No wallets detected</div>
      {/if}
    </div>
  </div>

  <!-- Error Display -->
  {#if wallet.error || web3User.error}
    <div class="mb-4">
      <h4 class="font-medium mb-2 text-red-400">Errors:</h4>
      <div class="text-sm text-red-300">
        {#if wallet.error}
          <div>Wallet: {wallet.error}</div>
        {/if}
        {#if web3User.error}
          <div>Auth: {web3User.error}</div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Actions -->
  <div class="flex space-x-2">
    {#if wallet.connected}
      <button
        on:click={wallet.disconnect}
        class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
      >
        Disconnect Wallet
      </button>
    {:else}
      <button
        on:click={wallet.connect}
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
      >
        Connect Wallet
      </button>
    {/if}

    {#if web3User.isAuthenticated}
      <button
        on:click={web3User.signOut}
        class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors"
      >
        Sign Out
      </button>
    {/if}
  </div>

  <!-- Hybrid Approach Info -->
  <div class="mt-4 p-3 bg-gray-700 rounded text-xs">
    <h5 class="font-medium mb-1">🔄 Hybrid Session Management:</h5>
    <ul class="text-gray-300 space-y-1">
      <li>• Auto-connects wallet if session exists</li>
      <li>• Clears session if wallet unavailable</li>
      <li>• Syncs state on wallet disconnect</li>
      <li>• Handles external wallet changes</li>
    </ul>
  </div>
</div>
