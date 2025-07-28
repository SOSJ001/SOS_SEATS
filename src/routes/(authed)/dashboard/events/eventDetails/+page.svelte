<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import ShareEventModal from "$lib/components/ShareEventModal.svelte";
  import { page } from "$app/stores";

  // Get the event data from the server
  export let data;

  let activeTab = "all";
  let searchQuery = "";
  let showShareModal = false;
  let eventData = data.event;

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  function getFilteredGuests() {
    let filtered = eventData.guests || [];

    // Filter by tab
    if (activeTab === "checked-in") {
      filtered = filtered.filter((guest) => guest.status === "checked_in");
    } else if (activeTab === "pending") {
      filtered = filtered.filter((guest) => guest.status === "pending");
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (guest) =>
          guest.name.toLowerCase().includes(query) ||
          guest.ticketType.toLowerCase().includes(query) ||
          guest.status.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  function editEvent() {
    // Navigate to the edit event route with the event ID
    const eventId = eventData.id;
    goto(`/dashboard/events/editEvent/${eventId}`);
  }

  function openShareModal() {
    showShareModal = true;
  }

  function closeShareModal() {
    showShareModal = false;
  }
</script>

{#if data.error}
  <div class="text-center py-12" in:fade={{ duration: 300 }}>
    <svg
      class="mx-auto h-12 w-12 text-red-400"
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
    <h3 class="mt-2 text-sm font-medium text-red-300">Error Loading Event</h3>
    <p class="mt-1 text-sm text-gray-500">
      {data.error}
    </p>
    <button
      on:click={() => goto("/dashboard/events")}
      class="mt-4 bg-teal-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-600 transition-colors duration-200"
    >
      Back to Events
    </button>
  </div>
{:else}
  <div class="space-y-6" in:fade={{ duration: 300 }}>
    <!-- Back Navigation -->
    <div class="flex items-center mb-4">
      <button
        on:click={() => goto("/dashboard/events")}
        class="flex items-center text-gray-300 hover:text-white transition-colors duration-200 group"
      >
        <svg
          class="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span class="text-sm font-medium">Back to Events</span>
      </button>
    </div>

    <!-- Event Banner -->
    <div class="relative h-64 rounded-lg overflow-hidden">
      <img
        src={eventData.image}
        alt={eventData.title}
        class="w-full h-full object-cover"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
      ></div>
      <div class="absolute bottom-6 left-6 text-white">
        <h1 class="text-4xl font-bold mb-2">{eventData.title}</h1>
        <p class="text-lg text-gray-200">{eventData.date}</p>
      </div>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        class="bg-gray-800 rounded-lg p-6"
        in:fly={{ y: 20, duration: 300, delay: 0 }}
      >
        <div class="text-3xl font-bold text-teal-400 mb-2">
          {eventData.ticketsSold} / {eventData.totalCapacity}
        </div>
        <div class="text-sm text-gray-400">TICKETS SOLD</div>
      </div>

      <div
        class="bg-gray-800 rounded-lg p-6"
        in:fly={{ y: 20, duration: 300, delay: 100 }}
      >
        <div class="text-3xl font-bold text-teal-400 mb-2">
          {formatCurrency(eventData.totalRevenue)}
        </div>
        <div class="text-sm text-gray-400">TOTAL REVENUE</div>
      </div>

      <div
        class="bg-gray-800 rounded-lg p-6"
        in:fly={{ y: 20, duration: 300, delay: 200 }}
      >
        <div class="text-3xl font-bold text-teal-400 mb-2">
          {eventData.attendeesCheckedIn}
        </div>
        <div class="text-sm text-gray-400">ATTENDEES CHECKED IN</div>
      </div>

      <div
        class="bg-gray-800 rounded-lg p-6"
        in:fly={{ y: 20, duration: 300, delay: 300 }}
      >
        <div class="text-3xl font-bold text-teal-400 mb-2">
          {eventData.remainingTickets}
        </div>
        <div class="text-sm text-gray-400">REMAINING TICKETS</div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Event Information -->
        <div
          class="bg-gray-800 rounded-lg p-6"
          in:fly={{ y: 20, duration: 300, delay: 400 }}
        >
          <h2 class="text-xl font-bold text-white mb-4">Event Information</h2>
          <div class="space-y-4">
            <div class="flex items-center text-gray-300">
              <svg
                class="w-5 h-5 mr-3 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>{eventData.date}</span>
            </div>
            <div class="flex items-center text-gray-300">
              <svg
                class="w-5 h-5 mr-3 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>{eventData.time}</span>
            </div>
            <div class="flex items-center text-gray-300">
              <svg
                class="w-5 h-5 mr-3 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>{eventData.location}</span>
            </div>
          </div>
          <p class="text-gray-300 mt-4 leading-relaxed">
            {eventData.description}
          </p>
        </div>

        <!-- Ticket Types -->
        <div
          class="bg-gray-800 rounded-lg p-6"
          in:fly={{ y: 20, duration: 300, delay: 500 }}
        >
          <h2 class="text-xl font-bold text-white mb-4">Ticket Types</h2>
          <div class="space-y-4">
            {#each eventData.ticketTypes as ticket}
              <div
                class="flex justify-between items-center p-4 bg-gray-700 rounded-lg"
              >
                <div>
                  <h3 class="font-semibold text-white">{ticket.name}</h3>
                  <p class="text-sm text-gray-400">
                    Sold: {ticket.sold} Remaining: {ticket.remaining}
                  </p>
                </div>
                <div class="text-right">
                  <div class="text-xl font-bold text-teal-400">
                    {formatCurrency(ticket.price)}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Sales Analytics -->
        <div
          class="bg-gray-800 rounded-lg p-6"
          in:fly={{ y: 20, duration: 300, delay: 600 }}
        >
          <h2 class="text-xl font-bold text-white mb-4">Sales Analytics</h2>
          <div
            class="flex items-center justify-center h-48 bg-gray-700 rounded-lg"
          >
            <div class="text-center text-gray-400">
              <svg
                class="w-12 h-12 mx-auto mb-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
                />
              </svg>
              <p>Sales Chart Placeholder</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="space-y-6">
        <!-- Event Actions -->
        <div
          class="bg-gray-800 rounded-lg p-6"
          in:fly={{ y: 20, duration: 300, delay: 700 }}
        >
          <h2 class="text-xl font-bold text-white mb-4">Event Actions</h2>
          <div class="space-y-3">
            <button
              on:click={editEvent}
              class="w-full bg-gradient-to-r from-teal-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity duration-200 flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Event
            </button>
            <button
              on:click={openShareModal}
              class="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              Share Event
            </button>
            <button
              class="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 mr-2"
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
              Download Guest List
            </button>
            <button
              class="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Cancel Event
            </button>
          </div>
        </div>

        <!-- QR Code -->
        <div
          class="bg-gray-800 rounded-lg p-6"
          in:fly={{ y: 20, duration: 300, delay: 800 }}
        >
          <h2 class="text-xl font-bold text-white mb-4">QR Code</h2>
          <div class="text-center">
            <div
              class="w-32 h-32 bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center"
            >
              <svg
                class="w-16 h-16 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <p class="text-gray-300 text-sm mb-4">
              Scan this QR code for quick event entry.
            </p>
            <button
              class="w-full bg-teal-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-600 transition-colors duration-200 flex items-center justify-center"
            >
              <svg
                class="w-4 h-4 mr-2"
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
              Download QR Code
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Guest List -->
    <div
      class="bg-gray-800 rounded-lg p-6"
      in:fly={{ y: 20, duration: 300, delay: 900 }}
    >
      <h2 class="text-xl font-bold text-white mb-4">Guest List</h2>

      <!-- Search Input -->
      <div class="relative mb-6">
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        >
          <svg
            class="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search guests by name, ticket type, or status..."
          class="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        />
      </div>

      <!-- Tabs -->
      <div class="flex space-x-1 mb-6">
        <button
          on:click={() => (activeTab = "all")}
          class="px-4 py-2 rounded-lg transition-colors duration-200 {activeTab ===
          'all'
            ? 'bg-teal-500 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        >
          All
        </button>
        <button
          on:click={() => (activeTab = "checked-in")}
          class="px-4 py-2 rounded-lg transition-colors duration-200 {activeTab ===
          'checked-in'
            ? 'bg-teal-500 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        >
          Checked In
        </button>
        <button
          on:click={() => (activeTab = "pending")}
          class="px-4 py-2 rounded-lg transition-colors duration-200 {activeTab ===
          'pending'
            ? 'bg-teal-500 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        >
          Pending
        </button>
      </div>

      <!-- Guest Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="text-left py-3 px-4 text-gray-400 font-medium">NAME</th
              >
              <th class="text-left py-3 px-4 text-gray-400 font-medium"
                >TICKET TYPE</th
              >
              <th class="text-left py-3 px-4 text-gray-400 font-medium"
                >STATUS</th
              >
            </tr>
          </thead>
          <tbody>
            {#each getFilteredGuests() as guest}
              <tr
                class="border-b border-gray-700 hover:bg-gray-700 transition-colors duration-200"
              >
                <td class="py-3 px-4">
                  <div class="flex items-center">
                    <img
                      src={guest.avatar}
                      alt={guest.name}
                      class="w-8 h-8 rounded-full mr-3"
                    />
                    <span class="text-white">{guest.name}</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-gray-300">{guest.ticketType}</td>
                <td class="py-3 px-4">
                  <span class="{guest.statusColor} font-medium"
                    >{guest.status === "checked_in"
                      ? "Checked In"
                      : guest.status === "pending"
                        ? "Pending"
                        : guest.status}</span
                  >
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Share Event Modal -->
  <ShareEventModal
    event={eventData}
    isOpen={showShareModal}
    on:close={closeShareModal}
  />
{/if}
