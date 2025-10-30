<script lang="ts">
  import SeatMap from "$lib/components/SeatMap.svelte";
  import BulkOperations from "$lib/components/BulkOperations.svelte";
  import SeatDetails from "$lib/components/SeatDetails.svelte";
  import EventSelector from "$lib/components/EventSelector.svelte";
  import { onMount } from "svelte";

  export const data = undefined;

  let selectedEvent = "";
  let selectedSeat: string | null = null;

  // Animation states
  let isLoaded = false;
  let showContent = false;

  onMount(() => {
    // Trigger entrance animations
    setTimeout(() => {
      isLoaded = true;
    }, 100);

    setTimeout(() => {
      showContent = true;
    }, 300);
  });

  function handleEventChange(eventId: string) {
    selectedEvent = eventId;
    selectedSeat = null; // Reset selected seat when event changes
  }

  function handleSeatClick(seatId: string) {
    selectedSeat = seatId;
  }

  function handleSelectAll() {
    // Implementation for selecting all available seats
  }

  function handleAssignMultiple() {
    // Implementation for assigning multiple seats
  }

  function handleChangePrice() {
    // Implementation for changing price
  }

  function handleDeleteSeats() {
    // Implementation for deleting seats
  }
</script>

<div class="min-h-screen bg-gray-900 text-white">
  <!-- Header -->
  <div
    class="mb-8 transition-all duration-1000 transform {isLoaded
      ? 'translate-y-0 opacity-100'
      : 'translate-y-8 opacity-0'}"
  >
    <h1 class="text-3xl font-bold text-white mb-2">Seat Management</h1>
    <p class="text-gray-400">
      Manage seating arrangements and ticket assignments
    </p>
  </div>

  <!-- Event Selector -->
  <div
    class="mb-6 transition-all duration-1000 transform {showContent
      ? 'translate-y-0 opacity-100'
      : 'translate-y-8 opacity-0'}"
  >
    <h2 class="block text-sm font-medium text-gray-400 mb-2">Select Event</h2>
    <EventSelector
      bind:selectedEvent
      on:eventChange={(e) => handleEventChange(e.detail.eventId)}
    />
  </div>

  <!-- Main Content Grid -->
  <div
    class="grid grid-cols-1 lg:grid-cols-4 gap-6 transition-all duration-1000 transform {showContent
      ? 'translate-y-0 opacity-100'
      : 'translate-y-8 opacity-0'}"
  >
    <!-- Left Column - Bulk Operations and Seat Map -->
    <div class="lg:col-span-3 space-y-6">
      <!-- Bulk Operations -->
      <BulkOperations
        onSelectAll={handleSelectAll}
        onAssignMultiple={handleAssignMultiple}
        onChangePrice={handleChangePrice}
        onDeleteSeats={handleDeleteSeats}
      />

      <!-- Seat Map -->
      <SeatMap {selectedSeat} onSeatClick={handleSeatClick} />
    </div>

    <!-- Right Column - Seat Details -->
    <div class="lg:col-span-1">
      <SeatDetails {selectedSeat} />
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
