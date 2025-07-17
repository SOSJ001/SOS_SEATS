<script lang="ts">
  export let scanResult: {
    success: boolean;
    message: string;
    guestName?: string;
    ticketType?: string;
    section?: string;
    timestamp: string;
  } | null = null;

  function getStatusIcon() {
    if (!scanResult) return null;

    if (scanResult.success) {
      return `<svg class="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>`;
    } else {
      return `<svg class="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>`;
    }
  }
</script>

{#if scanResult}
  <div
    class="mt-6 p-6 rounded-lg shadow-lg transition-all duration-300 transform scale-100"
  >
    {#if scanResult.success}
      <!-- Success Result -->
      <div class="bg-green-600 border border-green-500 rounded-lg p-4">
        <div class="flex items-center mb-3">
          {@html getStatusIcon()}
          <h3 class="ml-2 text-white font-bold text-lg">Ticket Verified!</h3>
        </div>

        <div class="space-y-2 text-white">
          <p class="font-semibold">{scanResult.guestName}</p>
          <p class="text-green-100">
            {scanResult.ticketType} - {scanResult.section}
          </p>
          <p class="text-green-200 text-sm">{scanResult.timestamp}</p>
        </div>
      </div>
    {:else}
      <!-- Error Result -->
      <div class="bg-red-600 border border-red-500 rounded-lg p-4">
        <div class="flex items-center mb-3">
          {@html getStatusIcon()}
          <h3 class="ml-2 text-white font-bold text-lg">Scan Failed</h3>
        </div>

        <div class="space-y-2 text-white">
          <p class="font-semibold">{scanResult.message}</p>
          <p class="text-red-200 text-sm">{scanResult.timestamp}</p>
        </div>
      </div>
    {/if}
  </div>
{/if}
