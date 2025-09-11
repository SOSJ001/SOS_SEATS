<script lang="ts">
  import { env } from "$env/dynamic/public";

  // Get current network from environment
  const currentNetwork = env.PUBLIC_SOLANA_NETWORK || "devnet";

  // Sample network data - in real app this would come from props
  let networks = [
    {
      name: "Solana Mainnet",
      status: currentNetwork === "mainnet-beta" ? "online" : "offline",
      color: currentNetwork === "mainnet-beta" ? "green" : "gray",
    },
    {
      name: "Solana Devnet",
      status: currentNetwork === "devnet" ? "online" : "offline",
      color: currentNetwork === "devnet" ? "green" : "gray",
    },
    {
      name: "Solana Testnet",
      status: currentNetwork === "testnet" ? "online" : "offline",
      color: currentNetwork === "testnet" ? "green" : "gray",
    },
  ];

  function getStatusColor(color: string) {
    switch (color) {
      case "green":
        return "bg-green-400";
      case "yellow":
        return "bg-yellow-400";
      case "red":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  }
</script>

<div class="space-y-4 md:space-y-6">
  <h2 class="text-lg md:text-xl font-bold text-white">Network Status</h2>

  <div class="space-y-3">
    {#each networks as network}
      <div
        class="flex items-center justify-between p-3 md:p-4 bg-gray-800 rounded-lg"
      >
        <span class="text-gray-300 text-sm md:text-base">{network.name}</span>
        <div class="flex items-center space-x-2">
          <div
            class="w-3 h-3 rounded-full {getStatusColor(network.color)}"
          ></div>
        </div>
      </div>
    {/each}
  </div>
</div>
