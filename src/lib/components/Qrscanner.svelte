<script lang="ts">
  export let isScanning: boolean = false;
  export let onScan: (result: string) => void = () => {};

  let scannerContainer: HTMLDivElement;

  // Simulate QR code scanning for demo purposes
  function simulateScan() {
    if (!isScanning) return;

    // Simulate scanning delay
    setTimeout(() => {
      const sampleResults = [
        "ticket_123_alice_johnson_vip",
        "ticket_456_bob_williams_ga",
        "ticket_789_charlie_brown_vip",
      ];
      const randomResult =
        sampleResults[Math.floor(Math.random() * sampleResults.length)];
      onScan(randomResult);
    }, 2000);
  }

  // Start scanning when component mounts
  $: if (isScanning) {
    simulateScan();
  }
</script>

<div class="flex flex-col items-center justify-center">
  <!-- QR Scanner View -->
  <div
    bind:this={scannerContainer}
    class="relative w-80 h-80 bg-gray-800 border-2 border-cyan-400 rounded-lg overflow-hidden shadow-lg"
    style="box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);"
  >
    <!-- Glowing particles effect -->
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute top-4 left-4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
        style="animation-delay: 0s;"
      ></div>
      <div
        class="absolute top-8 right-8 w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
        style="animation-delay: 0.5s;"
      ></div>
      <div
        class="absolute bottom-8 left-8 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"
        style="animation-delay: 1s;"
      ></div>
      <div
        class="absolute bottom-4 right-4 w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
        style="animation-delay: 1.5s;"
      ></div>
      <div
        class="absolute top-1/2 left-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
        style="animation-delay: 0.8s;"
      ></div>
      <div
        class="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"
        style="animation-delay: 1.2s;"
      ></div>
    </div>

    <!-- Camera view placeholder -->
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="text-center">
        <svg
          class="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
            clip-rule="evenodd"
          />
        </svg>
        <p class="text-gray-400 text-sm">
          {isScanning ? "Scanning..." : "Position QR code in frame"}
        </p>
      </div>
    </div>

    <!-- Scanning animation overlay -->
    {#if isScanning}
      <div
        class="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-pulse"
      ></div>
    {/if}
  </div>

  <!-- Scan status indicator -->
  <div class="mt-6 text-center">
    <p class="text-gray-400 text-sm">
      {isScanning ? "Scanning in progress..." : "Ready to scan"}
    </p>
  </div>
</div>
