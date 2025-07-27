<script>
  // @ts-nocheck
  import { fade, fly } from "svelte/transition";
  import { onMount } from "svelte";
  import ShareEventModal from "$lib/components/ShareEventModal.svelte";

  // Event data
  let events = [];
  let isLoading = true;
  let error = null;

  // Share modal state
  let showShareModal = false;
  let selectedEventForSharing = null;

  onMount(async () => {
    await loadEvents();
  });

  async function loadEvents() {
    try {
      isLoading = true;
      const response = await fetch("/loadUserEventsApi");
      const result = await response.json();

      if (result.success) {
        if (result.events && result.events.length > 0) {
          events = result.events.map((event) => ({
            id: event.id,
            title: event.name,
            date: formatEventDate(event.date, event.time),
            location: event.location,
            image:
              event.image?.file_path ||
              "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop",
            status: event.status || "draft", // Keep original case for filtering
            statusColor: getStatusColor(event.status),
            ticketsSold: getTicketsSold(event),
            revenue: getRevenue(event),
            primaryAction: getPrimaryAction(event.status),
            primaryActionColor: getPrimaryActionColor(event.status),
            secondaryAction: getSecondaryAction(event.status),
            secondaryActionColor:
              "border-white text-white hover:bg-white hover:text-gray-900",
          }));
        } else {
          events = [];
        }
      } else {
        error = result.error;
      }
    } catch (err) {
      error = "Failed to load events";
      console.error("Error loading events:", err);
    } finally {
      isLoading = false;
    }
  }

  function formatEventDate(date, time) {
    if (!date) return "Date not set";
    const eventDate = new Date(date);
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return time ? `${formattedDate} at ${time}` : formattedDate;
  }

  function getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case "live":
      case "published":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      case "draft":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  }

  function getTicketsSold(event) {
    // Calculate total tickets sold from ticket_types
    const totalSold =
      event.ticket_types?.reduce(
        (sum, ticket) => sum + (ticket.sold_quantity || 0),
        0
      ) || 0;
    return totalSold.toLocaleString();
  }

  function getRevenue(event) {
    // Calculate total revenue from ticket_types
    const totalRevenue =
      event.ticket_types?.reduce((sum, ticket) => {
        return sum + (ticket.price || 0) * (ticket.sold_quantity || 0);
      }, 0) || 0;
    return `$${totalRevenue.toLocaleString()}`;
  }

  function getPrimaryAction(status) {
    switch (status?.toLowerCase()) {
      case "live":
      case "published":
        return activeFilter === "upcoming" ? "Share Event" : "Manage Event";
      case "completed":
        return "View Report";
      case "draft":
        return "Edit Draft";
      default:
        return activeFilter === "upcoming" ? "Share Event" : "Manage Event";
    }
  }

  function getPrimaryActionColor(status) {
    switch (status?.toLowerCase()) {
      case "live":
      case "published":
        return "from-blue-500 to-blue-600";
      case "completed":
        return "from-blue-500 to-blue-600";
      case "draft":
        return "from-purple-500 to-purple-600";
      default:
        return "from-blue-500 to-blue-600";
    }
  }

  function getSecondaryAction(status) {
    switch (status?.toLowerCase()) {
      case "live":
      case "published":
        return "View Details";
      case "completed":
        return "Archive";
      case "draft":
        return "Publish";
      default:
        return "View Details";
    }
  }

  let searchQuery = "";
  let activeFilter = "upcoming";
  let filteredEvents = events;

  // Filter events based on search and filter
  $: {
    filteredEvents = events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());

      const eventStatus = event.status?.toLowerCase();

      if (activeFilter === "upcoming") {
        const isUpcoming =
          matchesSearch &&
          (eventStatus === "live" || eventStatus === "published");
        return isUpcoming;
      } else if (activeFilter === "past") {
        const isPast =
          matchesSearch &&
          (eventStatus === "completed" || eventStatus === "cancelled");
        return isPast;
      } else if (activeFilter === "drafts") {
        const isDraft = matchesSearch && eventStatus === "draft";
        return isDraft;
      }
      return matchesSearch;
    });
  }

  // Share event functionality
  function shareEvent(event) {
    selectedEventForSharing = event;
    showShareModal = true;
    console.log("Opening share modal for event:", event.title);
  }

  // Close share modal
  function closeShareModal() {
    showShareModal = false;
    selectedEventForSharing = null;
  }
</script>

<div class="space-y-6" in:fade={{ duration: 300 }}>
  <!-- Page Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-3xl font-bold text-white">My Events</h1>
  </div>

  <!-- Search and Filters -->
  <div
    class="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between"
  >
    <!-- Search Bar -->
    <div class="relative flex-1 max-w-md">
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
        bind:value={searchQuery}
        type="text"
        placeholder="Search events..."
        class="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      />
    </div>

    <!-- Filter Buttons -->
    <div class="flex gap-2">
      <button
        on:click={() => (activeFilter = "upcoming")}
        class="px-4 py-2 rounded-lg transition-all duration-200 {activeFilter ===
        'upcoming'
          ? 'bg-teal-500 text-white border-teal-500'
          : 'bg-gray-800 text-white border border-gray-700 hover:border-teal-500'}"
      >
        Upcoming
      </button>
      <button
        on:click={() => (activeFilter = "past")}
        class="px-4 py-2 rounded-lg transition-all duration-200 {activeFilter ===
        'past'
          ? 'bg-teal-500 text-white border-teal-500'
          : 'bg-gray-800 text-white border border-gray-700 hover:border-teal-500'}"
      >
        Past
      </button>
      <button
        on:click={() => (activeFilter = "drafts")}
        class="px-4 py-2 rounded-lg transition-all duration-200 {activeFilter ===
        'drafts'
          ? 'bg-teal-500 text-white border-teal-500'
          : 'bg-gray-800 text-white border border-gray-700 hover:border-teal-500'}"
      >
        Drafts
      </button>
    </div>
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <div class="col-span-full flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"
        ></div>
        <p class="text-gray-300">Loading events...</p>
      </div>
    </div>
  {:else if error}
    <div class="col-span-full text-center py-12">
      <p class="text-red-400 mb-4">{error}</p>
      <button
        on:click={loadEvents}
        class="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  {:else if filteredEvents.length === 0}
    <div class="col-span-full text-center py-12">
      <p class="text-gray-400 mb-4">
        No events found. Create your first event to get started!
      </p>
      <a
        href="/dashboard/events/createEvent"
        class="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
      >
        Create Event
      </a>
    </div>
  {:else}
    <!-- Events Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {#each filteredEvents as event, index}
        <div
          class="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-teal-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-teal-400/10"
          in:fly={{ y: 20, duration: 300, delay: index * 100 }}
        >
          <!-- Event Image -->
          <div class="relative h-48 overflow-hidden">
            <img
              src={event.image}
              alt={event.title}
              class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <!-- Status Badge -->
            <div class="absolute top-3 right-3">
              <span
                class="px-2 py-1 text-xs font-semibold rounded-full {event.statusColor} text-white"
              >
                {event.status}
              </span>
            </div>
          </div>

          <!-- Event Details -->
          <div class="p-6">
            <h3 class="text-xl font-bold text-white mb-3">{event.title}</h3>

            <!-- Date and Location -->
            <div class="space-y-2 mb-4">
              <div class="flex items-center text-gray-300">
                <svg
                  class="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-sm">{event.date}</span>
              </div>
              <div class="flex items-center text-gray-300">
                <svg
                  class="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-sm">{event.location}</span>
              </div>
            </div>

            <!-- Metrics -->
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-teal-400">
                  {event.ticketsSold}
                </div>
                <div class="text-xs text-gray-400">TICKETS SOLD</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-teal-400">
                  {event.revenue}
                </div>
                <div class="text-xs text-gray-400">REVENUE</div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <button
                on:click={() =>
                  activeFilter === "upcoming" ? shareEvent(event) : null}
                class="flex-1 bg-gradient-to-r {event.primaryActionColor} text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity duration-200"
              >
                {event.primaryAction}
              </button>
              <a
                href="/dashboard/events/eventDetails?id={event.id}"
                class="flex-1 border {event.secondaryActionColor} py-2 px-4 rounded-lg font-medium transition-all duration-200 hover:bg-gray-700 text-center"
              >
                {event.secondaryAction}
              </a>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Empty State -->
  {#if !isLoading && !error && filteredEvents.length === 0}
    <div class="text-center py-12" in:fade={{ duration: 300 }}>
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-300">No events found</h3>
      <p class="mt-1 text-sm text-gray-500">
        Try adjusting your search or filter criteria.
      </p>
    </div>
  {/if}
</div>

<!-- Floating Action Button -->
<a
  href="/dashboard/events/createEvent"
  class="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center group"
  title="Create New Event"
>
  <svg
    class="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200"
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
</a>

<!-- Share Event Modal -->
<ShareEventModal
  event={selectedEventForSharing}
  isOpen={showShareModal}
  on:close={closeShareModal}
/>
