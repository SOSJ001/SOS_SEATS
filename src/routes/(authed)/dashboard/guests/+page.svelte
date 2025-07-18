<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { onMount } from "svelte";
  import EventSelector from "$lib/components/EventSelector.svelte";
  import GuestFilters from "$lib/components/GuestFilters.svelte";
  import GuestTable from "$lib/components/GuestTable.svelte";

  let events = [
    { id: "1", title: "Neon Night Rave" },
    { id: "2", title: "Tech Conference 2024" },
    { id: "3", title: "Summer Music Festival" },
    { id: "4", title: "Business Networking Event" },
  ];

  let guests = [
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice.j@example.com",
      status: "Checked In" as const,
      avatar: "/api/placeholder/40/40",
    },
    {
      id: "2",
      name: "Bob Williams",
      email: "bob.w@example.com",
      status: "Checked In" as const,
      avatar: "/api/placeholder/40/40",
    },
    {
      id: "3",
      name: "Charlie Brown",
      email: "charlie.b@example.com",
      status: "Pending" as const,
      avatar: "/api/placeholder/40/40",
    },
    {
      id: "4",
      name: "Diana Prince",
      email: "diana.p@example.com",
      status: "Checked In" as const,
      avatar: "/api/placeholder/40/40",
    },
    {
      id: "5",
      name: "Eve Adams",
      email: "eve.a@example.com",
      status: "Pending" as const,
      avatar: "/api/placeholder/40/40",
    },
    {
      id: "6",
      name: "Frank Miller",
      email: "frank.m@example.com",
      status: "VIP" as const,
      avatar: "/api/placeholder/40/40",
    },
    {
      id: "7",
      name: "Grace Lee",
      email: "grace.l@example.com",
      status: "Checked In" as const,
      avatar: "/api/placeholder/40/40",
    },
    {
      id: "8",
      name: "Henry Wilson",
      email: "henry.w@example.com",
      status: "VIP" as const,
      avatar: "/api/placeholder/40/40",
    },
  ];

  let selectedEvent = "all";
  let searchQuery = "";
  let activeFilter = "all";
  let selectedGuests: string[] = [];
  let selectAll = false;
  let filteredGuests = guests;

  onMount(() => {
    // Load data from server
    // This would typically fetch from an API
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
      // In a real app, you'd filter by event ID
      // For now, we'll just show all guests
    }

    // Filter by status
    if (activeFilter !== "all") {
      filtered = filtered.filter((guest) => {
        switch (activeFilter) {
          case "checked-in":
            return guest.status === "Checked In";
          case "pending":
            return guest.status === "Pending";
          case "vip":
            return guest.status === "VIP";
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (guest) =>
          guest.name.toLowerCase().includes(query) ||
          guest.email.toLowerCase().includes(query) ||
          guest.status.toLowerCase().includes(query)
      );
    }

    filteredGuests = filtered;
  }

  function handleCheckIn(event: CustomEvent) {
    const guestId = event.detail.guestId;
    const guestIndex = guests.findIndex((g) => g.id === guestId);
    if (guestIndex !== -1) {
      guests[guestIndex].status = "Checked In";
      guests = [...guests]; // Trigger reactivity
      filterGuests();
    }
  }

  function handleDelete(event: CustomEvent) {
    const guestId = event.detail.guestId;
    guests = guests.filter((g) => g.id !== guestId);
    selectedGuests = selectedGuests.filter((id) => id !== guestId);
    filterGuests();
  }

  function handleDeleteSelected() {
    guests = guests.filter((g) => !selectedGuests.includes(g.id));
    selectedGuests = [];
    selectAll = false;
    filterGuests();
  }

  function exportCSV() {
    // Implementation for CSV export
    console.log("Exporting CSV...");
  }

  function exportPDF() {
    // Implementation for PDF export
    console.log("Exporting PDF...");
  }

  function addNewGuest() {
    // Implementation for adding new guest
    console.log("Adding new guest...");
  }
</script>

<div class="space-y-6" in:fade={{ duration: 300 }}>
  <!-- Page Title -->
  <div class="flex justify-between items-center">
    <h1 class="text-3xl font-bold text-white">Guest List</h1>
  </div>

  <!-- Event Selector -->
  <EventSelector {events} {selectedEvent} on:eventChange={handleEventChange} />

  <!-- Guest Filters -->
  <GuestFilters
    bind:searchQuery
    {activeFilter}
    selectedCount={selectedGuests.length}
    on:search={handleSearch}
    on:filterChange={handleFilterChange}
    on:deleteSelected={handleDeleteSelected}
  />

  <!-- Guest Table -->
  <div in:fly={{ y: 20, duration: 300, delay: 100 }}>
    <GuestTable
      guests={filteredGuests}
      {selectedGuests}
      {selectAll}
      on:selectionChange={handleSelectionChange}
      on:checkIn={handleCheckIn}
      on:delete={handleDelete}
    />
  </div>

  <!-- Export Buttons -->
  <div class="flex justify-end gap-4 mt-8">
    <button
      on:click={exportCSV}
      class="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2"
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
      class="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2"
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
    class="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center"
    in:fly={{ y: 20, duration: 300, delay: 200 }}
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 4v16m8-8H4"
      />
    </svg>
  </button>
</div>
