<script>
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";

  let eventData = {};
  let isPublishing = false;
  let publishSuccess = false;

  onMount(() => {
    // Load all data from previous steps
    const savedData = localStorage.getItem("eventCreationData");
    if (savedData) {
      eventData = JSON.parse(savedData);
    }
  });

  function formatDate(dateString) {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatTime(timeString) {
    if (!timeString) return "Not set";
    return timeString;
  }

  function formatPrice(price) {
    if (!price) return "Free";
    return `$${parseFloat(price).toFixed(2)}`;
  }

  async function publishEvent() {
    isPublishing = true;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Here you would typically send the data to your backend
      console.log("Publishing event:", eventData);

      // Clear localStorage
      localStorage.removeItem("eventCreationData");

      publishSuccess = true;

      // Redirect to events page after a short delay
      setTimeout(() => {
        goto("/dashboard/events");
      }, 2000);
    } catch (error) {
      console.error("Error publishing event:", error);
    } finally {
      isPublishing = false;
    }
  }

  function prevStep() {
    goto("/dashboard/events/createEvent/step4");
  }

  function editStep(step) {
    goto(`/dashboard/events/createEvent/step${step}`);
  }
</script>

<div class="max-w-4xl mx-auto p-6" in:fade={{ duration: 300 }}>
  <!-- Progress Bar -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-2xl font-bold text-white">Create Event</h2>
      <span class="text-gray-400">Step 5 of 5</span>
    </div>
    <div class="w-full bg-gray-700 rounded-full h-2">
      <div class="bg-teal-400 h-2 rounded-full" style="width: 100%"></div>
    </div>
  </div>

  <!-- Step Title -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-white mb-2">Review & Publish</h1>
    <p class="text-gray-400">
      Review all the details before publishing your event.
    </p>
  </div>

  {#if publishSuccess}
    <div
      class="bg-green-800 border border-green-600 rounded-lg p-6 text-center"
    >
      <svg
        class="w-16 h-16 text-green-400 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      <h3 class="text-2xl font-bold text-white mb-2">
        Event Published Successfully!
      </h3>
      <p class="text-green-200">
        Your event is now live and ready for ticket sales.
      </p>
    </div>
  {:else}
    <!-- Review Sections -->
    <div class="space-y-6">
      <!-- Basic Information -->
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-white">Basic Information</h3>
          <button
            on:click={() => editStep(1)}
            class="text-teal-400 hover:text-teal-300 text-sm"
          >
            Edit
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-gray-400 text-sm">Event Name</p>
            <p class="text-white font-medium">{eventData.name || "Not set"}</p>
          </div>
          <div>
            <p class="text-gray-400 text-sm">Date & Time</p>
            <p class="text-white font-medium">
              {formatDate(eventData.date)} at {formatTime(eventData.time)}
            </p>
          </div>
          <div>
            <p class="text-gray-400 text-sm">Location</p>
            <p class="text-white font-medium">
              {eventData.location || "Not set"}
            </p>
          </div>
          <div>
            <p class="text-gray-400 text-sm">Description</p>
            <p class="text-white font-medium">
              {eventData.description || "No description"}
            </p>
          </div>
        </div>
      </div>

      <!-- Event Details -->
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-white">Event Details</h3>
          <button
            on:click={() => editStep(2)}
            class="text-teal-400 hover:text-teal-300 text-sm"
          >
            Edit
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-gray-400 text-sm">Category</p>
            <p class="text-white font-medium">
              {eventData.category || "Not set"}
            </p>
          </div>
          <div>
            <p class="text-gray-400 text-sm">Organizer</p>
            <p class="text-white font-medium">
              {eventData.organizer || "Not set"}
            </p>
          </div>
          <div>
            <p class="text-gray-400 text-sm">Contact Email</p>
            <p class="text-white font-medium">
              {eventData.contactEmail || "Not set"}
            </p>
          </div>
          <div>
            <p class="text-gray-400 text-sm">Website</p>
            <p class="text-white font-medium">
              {eventData.website || "Not set"}
            </p>
          </div>
        </div>
        {#if eventData.tags && eventData.tags.length > 0}
          <div class="mt-4">
            <p class="text-gray-400 text-sm mb-2">Tags</p>
            <div class="flex flex-wrap gap-2">
              {#each eventData.tags as tag}
                <span
                  class="px-3 py-1 bg-teal-500 text-white text-sm rounded-full"
                  >{tag}</span
                >
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Ticket Types -->
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-white">Ticket Types</h3>
          <button
            on:click={() => editStep(3)}
            class="text-teal-400 hover:text-teal-300 text-sm"
          >
            Edit
          </button>
        </div>
        <div class="space-y-4">
          {#each eventData.ticketTypes || [] as ticket}
            <div class="p-4 bg-gray-700 rounded-lg">
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-medium text-white">{ticket.name}</h4>
                  <p class="text-gray-400 text-sm">{ticket.description}</p>
                </div>
                <div class="text-right">
                  <p class="text-white font-semibold">
                    {formatPrice(ticket.price)}
                  </p>
                  <p class="text-gray-400 text-sm">
                    {ticket.quantity} available
                  </p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Seating & Capacity -->
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-white">Seating & Capacity</h3>
          <button
            on:click={() => editStep(4)}
            class="text-teal-400 hover:text-teal-300 text-sm"
          >
            Edit
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-gray-400 text-sm">Seating Type</p>
            <p class="text-white font-medium capitalize">
              {eventData.seatingType || "Not set"}
            </p>
          </div>
          <div>
            <p class="text-gray-400 text-sm">Total Capacity</p>
            <p class="text-white font-medium">
              {eventData.totalCapacity || "Not set"}
            </p>
          </div>
          <div>
            <p class="text-gray-400 text-sm">Max Seats Per Order</p>
            <p class="text-white font-medium">
              {eventData.seatingOptions?.maxSeatsPerOrder || "4"}
            </p>
          </div>
          <div>
            <p class="text-gray-400 text-sm">Seat Selection</p>
            <p class="text-white font-medium">
              {eventData.seatingOptions?.allowSeatSelection
                ? "Enabled"
                : "Disabled"}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Publish Button -->
    <div class="mt-8 text-center">
      <button
        on:click={publishEvent}
        disabled={isPublishing}
        class="px-8 py-4 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if isPublishing}
          <div class="flex items-center justify-center">
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Publishing Event...
          </div>
        {:else}
          Publish Event
        {/if}
      </button>
    </div>
  {/if}

  <!-- Navigation Buttons -->
  {#if !publishSuccess}
    <div class="flex justify-between mt-8">
      <button
        on:click={prevStep}
        class="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
      >
        Previous
      </button>

      <button
        on:click={() => goto("/dashboard/events")}
        class="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
      >
        Cancel
      </button>
    </div>
  {/if}
</div>
