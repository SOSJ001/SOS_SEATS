<script lang="ts">
  import EventSelector from "$lib/components/EventSelector.svelte";
  import QRScanner from "$lib/components/Qrscanner.svelte";
  import ScanResult from "$lib/components/ScanResult.svelte";
  import ScanHistory from "$lib/components/ScanHistory.svelte";
  import { onMount } from "svelte";

  // Sample events data
  let events = [
    { id: "1", name: "Summer Music Festival 2024", date: "2024-07-15" },
    { id: "2", name: "Tech Conference 2024", date: "2024-08-20" },
    { id: "3", name: "Art Exhibition Opening", date: "2024-09-10" },
    { id: "4", name: "Food & Wine Festival", date: "2024-10-05" },
  ];

  let selectedEvent = "1";
  let isScanning = false;
  let currentScanResult: any = null;
  let scanHistory = [
    {
      id: "1",
      guestName: "Alice Johnson",
      status: "success" as const,
      message: "VIP Pass - Section A",
      timestamp: "10:30 AM",
    },
    {
      id: "2",
      guestName: "Invalid QR",
      status: "error" as const,
      message: "Invalid QR code",
      timestamp: "10:28 AM",
    },
    {
      id: "3",
      guestName: "Bob Williams",
      status: "success" as const,
      message: "General Admission",
      timestamp: "10:25 AM",
    },
    {
      id: "4",
      guestName: "Charlie Brown",
      status: "success" as const,
      message: "VIP Pass - Section B",
      timestamp: "10:22 AM",
    },
    {
      id: "5",
      guestName: "Duplicate Scan",
      status: "error" as const,
      message: "Ticket already scanned",
      timestamp: "10:20 AM",
    },
    {
      id: "6",
      guestName: "Diana Prince",
      status: "pending" as const,
      message: "Processing...",
      timestamp: "10:18 AM",
    },
  ];

  function handleEventChange(eventId: string) {
    selectedEvent = eventId;
    // Reset scan state when event changes
    isScanning = false;
    currentScanResult = null;
  }

  function handleScanResult(result: string) {
    // Parse the scan result (in real app, this would be actual QR data)
    const isSuccess = Math.random() > 0.3; // 70% success rate for demo

    if (isSuccess) {
      const guestNames = [
        "Alice Johnson",
        "Bob Williams",
        "Charlie Brown",
        "Diana Prince",
        "Eve Smith",
      ];
      const ticketTypes = ["VIP Pass", "General Admission", "Premium Pass"];
      const sections = ["Section A", "Section B", "Section C", "General"];

      const guestName =
        guestNames[Math.floor(Math.random() * guestNames.length)];
      const ticketType =
        ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
      const section = sections[Math.floor(Math.random() * sections.length)];

      currentScanResult = {
        success: true,
        message: "Ticket verified successfully",
        guestName,
        ticketType,
        section,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Add to scan history
      scanHistory = [
        {
          id: Date.now().toString(),
          guestName,
          status: "success",
          message: `${ticketType} - ${section}`,
          timestamp: currentScanResult.timestamp,
        },
        ...scanHistory.slice(0, 9), // Keep only last 10 entries
      ];
    } else {
      const errorMessages = [
        "Invalid QR code",
        "Ticket expired",
        "Duplicate scan",
        "Wrong event",
      ];
      const errorMessage =
        errorMessages[Math.floor(Math.random() * errorMessages.length)];

      currentScanResult = {
        success: false,
        message: errorMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Add to scan history
      scanHistory = [
        {
          id: Date.now().toString(),
          guestName: errorMessage,
          status: "error",
          message: errorMessage,
          timestamp: currentScanResult.timestamp,
        },
        ...scanHistory.slice(0, 9),
      ];
    }

    // Stop scanning after result
    isScanning = false;
  }

  function startScanning() {
    isScanning = true;
    currentScanResult = null;
  }

  function stopScanning() {
    isScanning = false;
  }

  // Animation states
  let isLoaded = false;
  let showScanner = false;
  let showHistory = false;

  onMount(() => {
    // Trigger entrance animations
    setTimeout(() => {
      isLoaded = true;
    }, 100);

    setTimeout(() => {
      showScanner = true;
    }, 300);

    setTimeout(() => {
      showHistory = true;
    }, 500);
  });
</script>

<div class="min-h-screen bg-gray-900 text-white">
  <!-- Header -->
  <div
    class="mb-8 transition-all duration-1000 transform {isLoaded
      ? 'translate-y-0 opacity-100'
      : 'translate-y-8 opacity-0'}"
  >
    <h1 class="text-3xl font-bold text-white mb-2">QR Code Scanner</h1>
    <p class="text-gray-400">Scan tickets and verify guest entry</p>
  </div>

  <!-- Main Content Grid -->
  <div
    class="grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-1000 transform {showScanner
      ? 'translate-y-0 opacity-100'
      : 'translate-y-8 opacity-0'}"
  >
    <!-- Left Column - Scanner Controls -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Event Selector -->
      <EventSelector
        {selectedEvent}
        {events}
        onEventChange={handleEventChange}
      />

      <!-- QR Scanner -->
      <div class="flex justify-center">
        <QRScanner {isScanning} onScan={handleScanResult} />
      </div>

      <!-- Scan Controls -->
      <div class="flex justify-center space-x-4">
        <button
          on:click={startScanning}
          disabled={isScanning}
          class="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Start Scanning
        </button>
        <button
          on:click={stopScanning}
          disabled={!isScanning}
          class="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Stop Scanning
        </button>
      </div>

      <!-- Scan Result -->
      <ScanResult scanResult={currentScanResult} />
    </div>

    <!-- Right Column - Scan History -->
    <div
      class="lg:col-span-1 transition-all duration-1000 transform {showHistory
        ? 'translate-x-0 opacity-100'
        : 'translate-x-8 opacity-0'}"
    >
      <ScanHistory {scanHistory} />
    </div>
  </div>

  <!-- Glowing particles background effect -->
  <div class="fixed inset-0 pointer-events-none overflow-hidden">
    <div
      class="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-30"
      style="animation-delay: 0s;"
    ></div>
    <div
      class="absolute top-1/3 right-1/3 w-1 h-1 bg-teal-400 rounded-full animate-pulse opacity-30"
      style="animation-delay: 1s;"
    ></div>
    <div
      class="absolute bottom-1/4 left-1/3 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-30"
      style="animation-delay: 2s;"
    ></div>
    <div
      class="absolute bottom-1/3 right-1/4 w-1 h-1 bg-teal-400 rounded-full animate-pulse opacity-30"
      style="animation-delay: 0.5s;"
    ></div>
  </div>
</div>
