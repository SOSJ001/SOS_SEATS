<script lang="ts">
  import SeatMap from "$lib/components/SeatMap.svelte";
  import BulkOperations from "$lib/components/BulkOperations.svelte";
  import SeatDetails from "$lib/components/SeatDetails.svelte";
  import EventSelector from "$lib/components/EventSelector.svelte";
  import { onMount } from "svelte";

  export let data;

  // Sample events data
  let events = [
    { id: "1", name: "Summer Music Festival 2024", date: "2024-07-15" },
    { id: "2", name: "Tech Conference 2024", date: "2024-08-20" },
    { id: "3", name: "Art Exhibition Opening", date: "2024-09-10" },
    { id: "4", name: "Food & Wine Festival", date: "2024-10-05" },
  ];

  let selectedEvent = "1";
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
    console.log('Select all available seats');
    // Implementation for selecting all available seats
  }

  function handleAssignMultiple() {
    console.log('Assign multiple seats');
    // Implementation for assigning multiple seats
  }

  function handleChangePrice() {
    console.log('Change price for selected seats');
    // Implementation for changing price
  }

  function handleDeleteSeats() {
    console.log('Delete selected seats');
    // Implementation for deleting seats
  }
</script>

<div class="min-h-screen bg-gray-900 text-white">
  <!-- Header -->
  <div class="mb-8 transition-all duration-1000 transform {isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
    <h1 class="text-3xl font-bold text-white mb-2">Seat Management</h1>
    <p class="text-gray-400">Manage seating arrangements and ticket assignments</p>
  </div>

  <!-- Event Selector -->
  <div class="mb-6 transition-all duration-1000 transform {showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
    <label class="block text-sm font-medium text-gray-400 mb-2">Select Event</label>
    <EventSelector
      selectedEvent={selectedEvent}
      {events}
      onEventChange={handleEventChange}
    />
  </div>

  <!-- Main Content Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 transition-all duration-1000 transform {showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
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
      <SeatMap
        {selectedSeat}
        onSeatClick={handleSeatClick}
      />
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
