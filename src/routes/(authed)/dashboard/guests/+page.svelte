<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { onMount } from "svelte";
  import EventSelector from "$lib/components/EventSelector.svelte";
  import GuestFilters from "$lib/components/GuestFilters.svelte";
  import GuestTable from "$lib/components/GuestTable.svelte";
  import GuestDetailsModal from "$lib/components/GuestDetailsModal.svelte";

  // Accept data from server
  export let data: any;

  // Helper function to format wallet address
  function formatWalletAddress(walletAddress: string): string {
    if (!walletAddress) return "No wallet";
    if (walletAddress.length <= 8) return walletAddress;
    return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  }

  // Initialize with dynamic data from server
  // Transform events data to match expected format (title -> name)
  let events = (data.eventsData?.data || []).map((event: any) => ({
    id: event.id,
    name: event.title || event.name, // Handle both title and name fields
    date: event.date,
  }));

  // Transform guests data to match expected format
  let guests = (data.guestsData?.data || []).map((guest: any) => ({
    id: guest.id,
    name:
      guest.name || `${guest.first_name || ""} ${guest.last_name || ""}`.trim(),
    wallet_address: formatWalletAddress(guest.wallet_address || ""),
    status: guest.status, // Keep original status from database (pending, confirmed, checked-in, cancelled)
    avatar:
      guest.avatar ||
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2MzY2ZjEiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgNC44MyAyLjE2IDQuODMgNC44M1MxNC42NyAxNC42NyAxMiAxNC42N1M3LjE3IDEyLjUxIDcuMTcgOS44M1M5LjMzIDUgMTIgNXptMCAxMmM0LjQyIDAgOC4xNy0yLjE2IDEwLjQyLTUuNDJDMjAuMTUgMTUuNjYgMTYuNDIgMTggMTIgMThzLTguMTUtMi4zNC0xMC40Mi01LjQyQzMuODMgMTQuODQgNy41OCAxNyAxMiAxN3oiLz4KPC9zdmc+Cjwvc3ZnPgo=",
    // Additional properties for extended functionality
    ticket_number:
      guest.order_item_id ||
      guest.ticket_number ||
      `TIX-${guest.id?.slice(0, 8)}`, // Use order_item_id as ticket number, fallback to ticket_number or generated ID
    phone: guest.phone,
    wallet_address_full: guest.wallet_address, // Keep full address for search
    seat_number: guest.seat_number,
    check_in_time: guest.check_in_time,
    event_id: guest.event_id,
    event_title: guest.event_title || guest.event_name,
    event_date: guest.event_date,
    ticket_type: guest.ticket_type_name || guest.ticket_type,
    ticket_price: guest.ticket_type_price || guest.ticket_price,
    venue_section: guest.venue_section_name || guest.venue_section,
    special_requirements: guest.special_requirements,
    created_at: guest.created_at,
    order_number: guest.order_number,
    payment_method: guest.payment_method,
    payment_status: guest.payment_status,
    // Add current owner information
    current_owner: guest.current_owner,
    // Keep original data for modal
    first_name: guest.first_name,
    last_name: guest.last_name,
    email: guest.email,
    ticket_type_name: guest.ticket_type_name,
    ticket_type_price: guest.ticket_type_price,
    venue_section_name: guest.venue_section_name,
    event_name: guest.event_name,
    order_item_id: guest.order_item_id, // Include order_item_id
  }));

  // Error handling - extract error messages properly
  let eventsError = data.eventsData?.error
    ? typeof data.eventsData.error === "string"
      ? data.eventsData.error
      : data.eventsData.error.message || "Unknown error loading events"
    : null;
  let guestsError = data.guestsData?.error
    ? typeof data.guestsData.error === "string"
      ? data.guestsData.error
      : data.guestsData.error.message || "Unknown error loading guests"
    : null;

  let selectedEvent = "all";
  let searchQuery = "";
  let activeFilter = "all";
  let selectedGuests: string[] = [];
  let selectAll = false;
  let filteredGuests = guests;

  // Modal state
  let showGuestDetailsModal = false;
  let selectedGuest: any = null;

  onMount(() => {
    // Initialize filtered guests with the loaded data
    filterGuests();
  });

  function handleEventChange(event: CustomEvent) {
    selectedEvent = event.detail.eventId;
    filterGuests();
  }

  function handleSearch(event: CustomEvent) {
    searchQuery = event.detail.query;
    filterGuests();
  }

  function handleFilterChange(event: CustomEvent) {
    activeFilter = event.detail.filter;
    filterGuests();
  }

  function handleSelectionChange(event: CustomEvent) {
    selectedGuests = event.detail.selectedGuests;
    selectAll = event.detail.selectAll;
  }

  function filterGuests() {
    let filtered = guests;

    // Filter by event
    if (selectedEvent !== "all") {
      filtered = filtered.filter(
        (guest: any) => String(guest.event_id) === String(selectedEvent)
      );
    }

    // Filter by status
    if (activeFilter !== "all") {
      filtered = filtered.filter((guest: any) => {
        const guestStatus = guest.status?.toLowerCase();

        switch (activeFilter) {
          case "checked-in":
            return guestStatus === "checked-in";
          case "pending":
            return guestStatus === "pending";
          case "vip":
            return guestStatus === "vip";
          case "confirmed":
            return guestStatus === "confirmed";
          case "cancelled":
            return guestStatus === "cancelled";
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (guest: any) =>
          guest.name.toLowerCase().includes(query) ||
          guest.wallet_address_full?.toLowerCase().includes(query) ||
          guest.status.toLowerCase().includes(query)
      );
    }

    filteredGuests = filtered;
  }

  function handleViewDetails(event: CustomEvent) {
    selectedGuest = event.detail.guest;
    showGuestDetailsModal = true;
  }

  function handleCloseModal() {
    showGuestDetailsModal = false;
    selectedGuest = null;
  }

  function handleDeleteSelected() {
    guests = guests.filter((g: any) => !selectedGuests.includes(g.id));
    selectedGuests = [];
    selectAll = false;
    filterGuests();
  }

  function exportCSV() {
    // Implementation for CSV export
  }

  function exportPDF() {
    // Implementation for PDF export
  }

  function addNewGuest() {
    // Implementation for adding new guest
  }
</script>

<div class="space-y-4 sm:space-y-6 px-4 sm:px-0" in:fade={{ duration: 300 }}>
  <!-- Page Title -->
  <div
    class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
  >
    <h1 class="text-2xl sm:text-3xl font-bold text-white">Guest List</h1>
  </div>

  <!-- Error Messages -->
  {#if eventsError || guestsError}
    <div
      class="bg-red-900/20 border border-red-500/50 rounded-lg p-3 sm:p-4 text-red-200"
    >
      <h3 class="font-semibold mb-2 text-sm sm:text-base">
        Error Loading Data
      </h3>
      {#if eventsError}
        <p class="text-xs sm:text-sm">Events: {eventsError}</p>
      {/if}
      {#if guestsError}
        <p class="text-xs sm:text-sm">Guests: {guestsError}</p>
      {/if}
    </div>
  {/if}

  <!-- Loading State -->
  {#if events.length === 0 && !eventsError}
    <div
      class="bg-blue-900/20 border border-blue-500/50 rounded-lg p-3 sm:p-4 text-blue-200"
    >
      <p class="text-sm sm:text-base">
        No events found. Create an event to start managing guests.
      </p>
    </div>
  {/if}

  <!-- Event Selector -->
  {#if events.length > 0}
    <EventSelector
      bind:selectedEvent
      {events}
      on:eventChange={handleEventChange}
    />
  {/if}

  <!-- Guest Filters -->
  {#if guests.length > 0 || events.length > 0}
    <GuestFilters
      bind:searchQuery
      {activeFilter}
      selectedCount={selectedGuests.length}
      on:search={handleSearch}
      on:filterChange={handleFilterChange}
      on:deleteSelected={handleDeleteSelected}
    />
  {/if}

  <!-- Guest Table -->
  {#if guests.length > 0}
    <div in:fly={{ y: 20, duration: 300, delay: 100 }}>
      <GuestTable
        guests={filteredGuests}
        {selectedGuests}
        {selectAll}
        on:selectionChange={handleSelectionChange}
        on:viewDetails={handleViewDetails}
      />
    </div>
  {:else if events.length > 0}
    <div
      class="bg-gray-900/20 border border-gray-500/50 rounded-lg p-6 sm:p-8 text-center text-gray-300"
    >
      <p class="text-base sm:text-lg mb-2">No guests found</p>
      <p class="text-xs sm:text-sm">
        Guests will appear here once they register for your events.
      </p>
    </div>
  {/if}

  <!-- Export Buttons -->
  <div
    class="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8"
  >
    <button
      on:click={exportCSV}
      class="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
    >
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      Export CSV
    </button>
    <button
      on:click={exportPDF}
      class="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
    >
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      Export PDF
    </button>
  </div>

  <!-- Floating Action Button -->
  <button
    on:click={addNewGuest}
    class="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center z-50"
    in:fly={{ y: 20, duration: 300, delay: 200 }}
  >
    <svg
      class="w-5 h-5 sm:w-6 sm:h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 4v16m8-8H4"
      />
    </svg>
  </button>

  <!-- Guest Details Modal -->
  <GuestDetailsModal
    bind:show={showGuestDetailsModal}
    guest={selectedGuest}
    on:close={handleCloseModal}
  />
</div>
