<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let eventData: any = {};
  let isLoading = true;
  let error = "";

  $: eventId = $page.params.eventId;

  onMount(async () => {
    await loadEventData();
  });

  async function loadEventData() {
    try {
      isLoading = true;
      // Here you would fetch the event data from your API
      // For now, we'll simulate loading event data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulated event data - replace with actual API call
      eventData = {
        id: eventId,
        name: "Sample Event",
        date: "2024-07-20",
        time: "19:00",
        location: "City Park Amphitheater",
        description: "An amazing event description",
        category: "Music & Concerts",
        organizer: "Event Organizer",
        contactEmail: "organizer@example.com",
        // Add more event data as needed
      };
    } catch (err) {
      error = "Failed to load event data";
      console.error("Error loading event:", err);
    } finally {
      isLoading = false;
    }
  }

  function startEditFlow() {
    // Store event data for the edit flow
    localStorage.setItem("eventEditData", JSON.stringify(eventData));
    goto(`/dashboard/events/editEvent/${eventId}/step1`);
  }

  function goBack() {
    goto("/dashboard/events");
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  <div class="mb-8">
    <button
      on:click={goBack}
      class="flex items-center text-gray-400 hover:text-white transition-colors duration-200 mb-4"
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
          d="M15 19l-7-7 7-7"
        ></path>
      </svg>
      Back to Events
    </button>
    <h1 class="text-3xl font-bold text-white mb-2">Edit Event</h1>
    <p class="text-gray-400">Make changes to your event details</p>
  </div>

  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"
        ></div>
        <p class="text-gray-300">Loading event data...</p>
      </div>
    </div>
  {:else if error}
    <div class="bg-red-800 border border-red-600 rounded-lg p-6 text-center">
      <svg
        class="w-16 h-16 text-red-400 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        ></path>
      </svg>
      <h3 class="text-xl font-bold text-white mb-2">Error Loading Event</h3>
      <p class="text-red-200 mb-4">{error}</p>
      <button
        on:click={goBack}
        class="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
      >
        Back to Events
      </button>
    </div>
  {:else}
    <!-- Event Preview -->
    <div class="bg-gray-800 rounded-xl p-8 mb-8">
      <h2 class="text-xl font-bold text-white mb-6">Current Event Details</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span class="text-gray-400 text-sm">Event Name:</span>
          <p class="text-white font-medium">{eventData.name}</p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Category:</span>
          <p class="text-white font-medium">{eventData.category}</p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Date:</span>
          <p class="text-white font-medium">{eventData.date}</p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Time:</span>
          <p class="text-white font-medium">{eventData.time}</p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Location:</span>
          <p class="text-white font-medium">{eventData.location}</p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Organizer:</span>
          <p class="text-white font-medium">{eventData.organizer}</p>
        </div>
      </div>

      <div class="mt-6">
        <span class="text-gray-400 text-sm">Description:</span>
        <p class="text-white font-medium mt-1">{eventData.description}</p>
      </div>
    </div>

    <!-- Edit Options -->
    <div class="bg-gray-800 rounded-xl p-8">
      <h2 class="text-xl font-bold text-white mb-6">Edit Options</h2>

      <div class="space-y-4">
        <button
          on:click={startEditFlow}
          class="w-full p-4 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 text-left"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold">Full Event Edit</h3>
              <p class="text-teal-100 text-sm">
                Edit all event details in a step-by-step process
              </p>
            </div>
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </div>
        </button>

        <button
          class="w-full p-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-left"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold">Quick Edit</h3>
              <p class="text-gray-300 text-sm">Edit basic information only</p>
            </div>
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </div>
        </button>

        <button
          class="w-full p-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-left"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold">Duplicate Event</h3>
              <p class="text-gray-300 text-sm">Create a copy of this event</p>
            </div>
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </div>
        </button>
      </div>
    </div>
  {/if}
</div>
