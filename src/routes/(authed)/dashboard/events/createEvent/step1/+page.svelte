<script>
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import StepperProgress from "$lib/components/StepperProgress.svelte";

  let eventData = {
    // Basic event information for database
    name: "", // Database: TEXT NOT NULL
    date: "", // Database: DATE NOT NULL
    time: "", // Database: TIME NOT NULL
    location: "", // Database: TEXT NOT NULL
    venue_address: "", // Database: TEXT (optional)
    description: "", // Database: TEXT (optional)
  };

  let errors = {};

  onMount(() => {
    // Load data from localStorage if returning from other steps
    const savedData = localStorage.getItem("eventCreationData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log("Step1 - Loading saved data:", parsed);
      console.log("Step1 - Current eventData before merge:", eventData);
      // Merge saved data with current eventData, preserving existing structure
      eventData = { ...eventData, ...parsed };
      console.log("Step1 - Final eventData after merge:", eventData);
    }
  });

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
      // Save to localStorage before navigating
      console.log("Step1 - Saving data:", eventData);
      localStorage.setItem("eventCreationData", JSON.stringify(eventData));
      goto("/dashboard/events/createEvent/step2");
    }
  }

  function prevStep() {
    // Save current data before going back
    localStorage.setItem("eventCreationData", JSON.stringify(eventData));
    goto("/dashboard/events");
  }

  function goBack() {
    goto("/dashboard/events");
  }
</script>

<div class="max-w-6xl mx-auto p-6" in:fade={{ duration: 300 }}>
  <!-- Title -->
  <div class="text-center mb-8">
    <h1 class="text-3xl font-bold text-white mb-2">Create New Event</h1>
  </div>

  <!-- Stepper Progress -->
  <StepperProgress currentStep={1} />

  <!-- Step Title -->
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-white mb-2">Basic Event Information</h2>
    <p class="text-gray-400">
      Let's start with the essential details about your event.
    </p>
  </div>

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
        <label for="date" class="block text-sm font-medium text-gray-300 mb-2">
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
        <label for="time" class="block text-sm font-medium text-gray-300 mb-2">
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

    <!-- Venue Address -->
    <div>
      <label
        for="venue_address"
        class="block text-sm font-medium text-gray-300 mb-2"
      >
        Venue Address
      </label>
      <input
        id="venue_address"
        type="text"
        bind:value={eventData.venue_address}
        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        placeholder="Enter full venue address (optional)"
      />
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
      on:click={prevStep}
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
</div>
