<script>
  export let settings;
  export let onInputChange;
  export let onDisconnectWallet;
</script>

<div class="bg-gray-800 rounded-lg p-4 sm:p-6">
  <h2 class="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center">
    <svg class="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    </svg>
    Web3 Settings
  </h2>
  
  <div class="space-y-3 sm:space-y-4">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-700">
      <span class="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0">Connected Wallet</span>
      <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        <span class="text-blue-400 font-mono text-sm sm:text-base">{settings.web3.wallet}</span>
        <button 
          on:click={onDisconnectWallet}
          class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors w-full sm:w-auto"
        >
          Disconnect
        </button>
      </div>
    </div>
    
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-700">
      <span class="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0">Default Network</span>
      <select 
        bind:value={settings.web3.network} 
        on:change={onInputChange}
        class="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm sm:text-base w-full sm:w-auto"
      >
        <option value="Polygon Mainnet">Polygon Mainnet</option>
        <option value="Ethereum Mainnet">Ethereum Mainnet</option>
        <option value="Binance Smart Chain">Binance Smart Chain</option>
        <option value="Solana Mainnet">Solana Mainnet</option>
      </select>
    </div>
    
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-700">
      <span class="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0">Gas Fee Preference</span>
      <select 
        bind:value={settings.web3.gasFee} 
        on:change={onInputChange}
        class="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm sm:text-base w-full sm:w-auto"
      >
        <option value="Standard">Standard</option>
        <option value="Fast">Fast</option>
        <option value="Slow">Slow</option>
      </select>
    </div>
    
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3">
      <span class="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0">Transaction History</span>
      <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors w-full sm:w-auto">
        View History
      </button>
    </div>
  </div>
</div>
