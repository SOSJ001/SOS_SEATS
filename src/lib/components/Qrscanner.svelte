<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { showToast } from "$lib/store";
  import { Html5Qrcode } from "html5-qrcode";

  export let isScanning: boolean = false;
  export let onScan: (result: string) => void = () => {};

  let scannerContainer: HTMLDivElement;
  let html5QrCode: Html5Qrcode | null = null;
  let isCameraSupported = true;
  let cameraError = "";
  let isProcessing = false;
  let scanAttempts = 0;
  const MAX_SCAN_ATTEMPTS = 10;

  // Real QR Code detection using html5-qrcode
  async function startCamera() {
    try {
      if (!scannerContainer) return;

      // Initialize Html5Qrcode
      html5QrCode = new Html5Qrcode("qr-reader");

      // Configure camera options
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5Qrcode.SCAN_TYPE_CAMERA],
      };

      // Start scanning
      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        config,
        (decodedText, decodedResult) => {
          // Success callback
          if (!isProcessing) {
            isProcessing = true;
            console.log("QR Code detected:", decodedText);
            onScan(decodedText);

            // Stop scanning after successful detection
            setTimeout(() => {
              isProcessing = false;
            }, 2000);
          }
        },
        (errorMessage) => {
          // Error callback - just log, don't show to user
          console.log("QR scan error:", errorMessage);
        }
      );

      isCameraSupported = true;
      cameraError = "";
    } catch (error) {
      console.error("Error accessing camera:", error);
      isCameraSupported = false;
      cameraError =
        error instanceof Error ? error.message : "Failed to access camera";
      showToast("error", "Camera Error", cameraError);
    }
  }

  async function stopCamera() {
    if (html5QrCode && html5QrCode.isScanning) {
      try {
        await html5QrCode.stop();
      } catch (error) {
        console.error("Error stopping camera:", error);
      }
    }
    html5QrCode = null;
  }

  // Watch for scanning state changes
  $: if (isScanning) {
    startCamera();
  } else {
    stopCamera();
  }

  onMount(() => {
    // Component mounted
  });

  onDestroy(() => {
    stopCamera();
  });
</script>

<div class="flex flex-col items-center justify-center">
  <!-- QR Scanner View -->
  <div
    bind:this={scannerContainer}
    class="relative w-80 h-80 bg-gray-800 border-2 border-cyan-400 rounded-lg overflow-hidden shadow-lg"
    style="box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);"
  >
    <!-- HTML5 QR Code Scanner -->
    <div id="qr-reader" class="w-full h-full"></div>

    <!-- Scanning overlay -->
    {#if isScanning}
      <!-- Scanning frame overlay -->
      <div
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div class="w-48 h-48 border-2 border-cyan-400 relative">
          <!-- Corner indicators -->
          <div
            class="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400"
          ></div>
          <div
            class="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400"
          ></div>
          <div
            class="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400"
          ></div>
          <div
            class="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400"
          ></div>

          <!-- Scanning line animation -->
          <div
            class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"
          ></div>
        </div>
      </div>

      <!-- Scanning animation overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-pulse pointer-events-none"
      ></div>
    {/if}

    <!-- Camera error overlay -->
    {#if !isCameraSupported}
      <div
        class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90"
      >
        <div class="text-center">
          <svg
            class="w-16 h-16 mx-auto text-red-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p class="text-red-400 text-sm mb-2">Camera Error</p>
          <p class="text-gray-400 text-xs">{cameraError}</p>
        </div>
      </div>
    {/if}

    <!-- Processing overlay -->
    {#if isProcessing}
      <div
        class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90"
      >
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"
          ></div>
          <p class="text-cyan-400 text-sm">Processing...</p>
        </div>
      </div>
    {/if}

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
    </div>
  </div>

  <!-- Scan status indicator -->
  <div class="mt-6 text-center">
    <p class="text-gray-400 text-sm">
      {#if isProcessing}
        Processing QR code...
      {:else if isScanning}
        Scanning in progress...
      {:else if !isCameraSupported}
        Camera not available
      {:else}
        Ready to scan
      {/if}
    </p>
    {#if isScanning && !isProcessing}
      <p class="text-cyan-400 text-xs mt-1">Position QR code in the frame</p>
    {/if}
  </div>
</div>

<style>
  /* Custom styles for html5-qrcode */
  :global(#qr-reader) {
    width: 100% !important;
    height: 100% !important;
  }

  :global(#qr-reader video) {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }

  :global(#qr-reader__scan_region) {
    background: transparent !important;
  }

  :global(#qr-reader__scan_region > img) {
    display: none !important;
  }

  :global(#qr-reader__dashboard) {
    display: none !important;
  }

  :global(#qr-reader__status_span) {
    display: none !important;
  }
</style>
