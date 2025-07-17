<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import StepperProgress from "$lib/components/StepperProgress.svelte";

  let eventData = {
    name: "",
    date: "",
    time: "",
    location: "",
    description: "",
  };

  let errors: Record<string, string> = {};
  let isLoading = true;

  $: eventId = $page.params.eventId;

  onMount(async () => {
    await loadEventData();
  });

  async function loadEventData() {
    try {
      // Load existing event data from localStorage or API
      const savedData = localStorage.getItem("eventEditData");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        eventData = { ...eventData, ...parsed };
      }
    } catch (error) {
      console.error("Error loading event data:", error);
    } finally {
      isLoading = false;
    }
  }

  function validateStep() {
    errors = {};

    if (!eventData.name.trim()) {
      errors.name = "Event name is required";
    }
    if (!eventData.date) {
      errors.date = "Event date is required";
    }
    if (!eventData.time) {
      errors.time = "Event time is required";
    }
    if (!eventData.location.trim()) {
      errors.location = "Event location is required";
    }

    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (validateStep()) {
      // Save to localStorage
      localStorage.setItem("eventEditData", JSON.stringify(eventData));
      goto(`/dashboard/events/editEvent/${eventId}/step2`);
    }
  }

  function goBack() {
    goto(`/dashboard/events/editEvent/${eventId}`);
  }
</script>

<div class="max-w-6xl mx-auto p-6" in:fade={{ duration: 300 }}>
  <!-- Title -->
  <div class="text-center mb-8">
    <h1 class="text-3xl font-bold text-white mb-2">Edit Event</h1>
  </div>

  <!-- Stepper Progress -->
  <StepperProgress currentStep={1} />

  <!-- Step Title -->
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-white mb-2">Basic Event Information</h2>
    <p class="text-gray-400">Update the essential details about your event.</p>
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
  {:else}
    <!-- Form -->
    <div class="bg-gray-800 rounded-xl p-8 space-y-6">
      <!-- Event Name -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-300 mb-2">
          Event Name *
        </label>
        <input
          id="name"
          type="text"
          bind:value={eventData.name}
          class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors.name
            ? 'border-red-500'
            : ''}"
          placeholder="Enter event name"
        />
        {#if errors.name}
          <p class="text-red-400 text-sm mt-1">{errors.name}</p>
        {/if}
      </div>

      <!-- Date and Time -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            for="date"
            class="block text-sm font-medium text-gray-300 mb-2"
          >
            Event Date *
          </label>
          <input
            id="date"
            type="date"
            bind:value={eventData.date}
            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors.date
              ? 'border-red-500'
              : ''}"
          />
          {#if errors.date}
            <p class="text-red-400 text-sm mt-1">{errors.date}</p>
          {/if}
        </div>

        <div>
          <label
            for="time"
            class="block text-sm font-medium text-gray-300 mb-2"
          >
            Event Time *
          </label>
          <input
            id="time"
            type="time"
            bind:value={eventData.time}
            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors.time
              ? 'border-red-500'
              : ''}"
          />
          {#if errors.time}
            <p class="text-red-400 text-sm mt-1">{errors.time}</p>
          {/if}
        </div>
      </div>

      <!-- Location -->
      <div>
        <label
          for="location"
          class="block text-sm font-medium text-gray-300 mb-2"
        >
          Event Location *
        </label>
        <input
          id="location"
          type="text"
          bind:value={eventData.location}
          class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors.location
            ? 'border-red-500'
            : ''}"
          placeholder="Enter event location"
        />
        {#if errors.location}
          <p class="text-red-400 text-sm mt-1">{errors.location}</p>
        {/if}
      </div>

      <!-- Description -->
      <div>
        <label
          for="description"
          class="block text-sm font-medium text-gray-300 mb-2"
        >
          Event Description
        </label>
        <textarea
          id="description"
          bind:value={eventData.description}
          rows="4"
          class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          placeholder="Describe your event..."
        ></textarea>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex justify-between mt-8">
      <button
        on:click={goBack}
        class="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
      >
        Cancel
      </button>

      <button
        on:click={nextStep}
        class="px-8 py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg hover:from-teal-500 hover:to-blue-600 transition-all duration-200 font-medium"
      >
        Next Step
      </button>
    </div>
  {/if}
</div>
