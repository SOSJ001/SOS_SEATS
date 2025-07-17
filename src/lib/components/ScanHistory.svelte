<script lang="ts">
  export let scanHistory: Array<{
    id: string;
    guestName: string;
    status: "success" | "error" | "pending";
    message: string;
    timestamp: string;
  }> = [];

  function getStatusIcon(status: string) {
    switch (status) {
      case "success":
        return `<svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>`;
      case "error":
        return `<svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>`;
      case "pending":
        return `<div class="w-4 h-4 bg-cyan-400 rounded-full animate-pulse"></div>`;
      default:
        return null;
    }
  }
</script>

<div class="bg-gray-800 rounded-lg p-4 h-full">
  <h3 class="text-white font-semibold text-lg mb-4">Scan History</h3>

  <div class="space-y-3 max-h-96 overflow-y-auto">
    {#each scanHistory as scan}
      <div
        class="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors duration-200"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            {@html getStatusIcon(scan.status)}
            <div>
              <p class="text-white font-medium text-sm">{scan.guestName}</p>
              <p class="text-gray-400 text-xs">{scan.timestamp}</p>
            </div>
          </div>
          {#if scan.status === "pending"}
            <div class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if scanHistory.length === 0}
    <div class="text-center py-8">
      <svg
        class="w-12 h-12 mx-auto text-gray-500 mb-3"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
          clip-rule="evenodd"
        />
      </svg>
      <p class="text-gray-400 text-sm">No scans yet</p>
      <p class="text-gray-500 text-xs">Start scanning to see history</p>
    </div>
  {/if}
</div>
