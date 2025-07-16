<script>
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";

  let eventData = {
    seatingType: "general", // general, assigned, mixed
    totalCapacity: "",
    venueLayout: {
      sections: [],
      hasSeatingChart: false,
    },
    seatingOptions: {
      allowSeatSelection: false,
      maxSeatsPerOrder: "4",
      reservedSeating: false,
    },
  };

  let errors = {};

  onMount(() => {
    // Load data from previous steps
    const savedData = localStorage.getItem("eventCreationData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      eventData = { ...eventData, ...parsed };
    }
  });

  function addSection() {
    eventData.venueLayout.sections = [
      ...eventData.venueLayout.sections,
      {
        name: "",
        capacity: "",
        price: "",
        description: "",
      },
    ];
  }

  function removeSection(index) {
    eventData.venueLayout.sections = eventData.venueLayout.sections.filter(
      (_, i) => i !== index
    );
  }

  function validateStep() {
    errors = {};

    if (!eventData.totalCapacity || parseInt(eventData.totalCapacity) <= 0) {
      errors.totalCapacity = "Valid total capacity is required";
    }

    if (
      eventData.seatingType === "assigned" &&
      eventData.venueLayout.sections.length === 0
    ) {
      errors.sections = "At least one section is required for assigned seating";
    }

    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (validateStep()) {
      localStorage.setItem("eventCreationData", JSON.stringify(eventData));
      goto("/dashboard/events/createEvent/step5");
    }
  }

  function prevStep() {
    localStorage.setItem("eventCreationData", JSON.stringify(eventData));
    goto("/dashboard/events/createEvent/step3");
  }
</script>

<div class="max-w-4xl mx-auto p-6" in:fade={{ duration: 300 }}>
  <!-- Progress Bar -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-2xl font-bold text-white">Create Event</h2>
      <span class="text-gray-400">Step 4 of 5</span>
    </div>
    <div class="w-full bg-gray-700 rounded-full h-2">
      <div class="bg-teal-400 h-2 rounded-full" style="width: 80%"></div>
    </div>
  </div>

  <!-- Step Title -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-white mb-2">Seating & Capacity</h1>
    <p class="text-gray-400">
      Configure how seating and capacity will work for your event.
    </p>
  </div>

  <!-- Form -->
  <div class="bg-gray-800 rounded-lg p-6 space-y-6">
    <!-- Seating Type -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-4">
        Seating Type
      </label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label class="relative">
          <input
            type="radio"
            bind:group={eventData.seatingType}
            value="general"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.seatingType ===
            'general'
              ? 'border-teal-400 bg-teal-400 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'}"
          >
            <div class="text-center">
              <svg
                class="w-8 h-8 mx-auto mb-2 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="font-semibold text-white">General Admission</h3>
              <p class="text-sm text-gray-400">
                First come, first served seating
              </p>
            </div>
          </div>
        </label>

        <label class="relative">
          <input
            type="radio"
            bind:group={eventData.seatingType}
            value="assigned"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.seatingType ===
            'assigned'
              ? 'border-teal-400 bg-teal-400 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'}"
          >
            <div class="text-center">
              <svg
                class="w-8 h-8 mx-auto mb-2 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              <h3 class="font-semibold text-white">Assigned Seating</h3>
              <p class="text-sm text-gray-400">
                Specific seats assigned to tickets
              </p>
            </div>
          </div>
        </label>

        <label class="relative">
          <input
            type="radio"
            bind:group={eventData.seatingType}
            value="mixed"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.seatingType ===
            'mixed'
              ? 'border-teal-400 bg-teal-400 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'}"
          >
            <div class="text-center">
              <svg
                class="w-8 h-8 mx-auto mb-2 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                  clip-rule="evenodd"
                />
              </svg>
              <h3 class="font-semibold text-white">Mixed Seating</h3>
              <p class="text-sm text-gray-400">
                Combination of assigned and general
              </p>
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- Total Capacity -->
    <div>
      <label
        for="totalCapacity"
        class="block text-sm font-medium text-gray-300 mb-2"
      >
        Total Event Capacity *
      </label>
      <input
        id="totalCapacity"
        type="number"
        bind:value={eventData.totalCapacity}
        min="1"
        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors.totalCapacity
          ? 'border-red-500'
          : ''}"
        placeholder="Enter total capacity"
      />
      {#if errors.totalCapacity}
        <p class="text-red-400 text-sm mt-1">{errors.totalCapacity}</p>
      {/if}
    </div>

    <!-- Seating Options -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-white">Seating Options</h3>

      <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
        <div>
          <h4 class="font-medium text-white">Allow Seat Selection</h4>
          <p class="text-sm text-gray-400">
            Let customers choose their specific seats
          </p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            bind:checked={eventData.seatingOptions.allowSeatSelection}
            class="sr-only peer"
          />
          <div
            class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"
          ></div>
        </label>
      </div>

      <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
        <div>
          <h4 class="font-medium text-white">Reserved Seating</h4>
          <p class="text-sm text-gray-400">
            Hold seats for VIP or special guests
          </p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            bind:checked={eventData.seatingOptions.reservedSeating}
            class="sr-only peer"
          />
          <div
            class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"
          ></div>
        </label>
      </div>

      <div>
        <label
          for="maxSeats"
          class="block text-sm font-medium text-gray-300 mb-2"
        >
          Max Seats Per Order
        </label>
        <select
          id="maxSeats"
          bind:value={eventData.seatingOptions.maxSeatsPerOrder}
          class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        >
          <option value="1">1 seat</option>
          <option value="2">2 seats</option>
          <option value="4">4 seats</option>
          <option value="6">6 seats</option>
          <option value="8">8 seats</option>
          <option value="10">10 seats</option>
        </select>
      </div>
    </div>

    <!-- Venue Sections (for assigned seating) -->
    {#if eventData.seatingType === "assigned"}
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-white">Venue Sections</h3>
          <button
            on:click={addSection}
            class="text-teal-400 hover:text-teal-300 text-sm"
          >
            + Add Section
          </button>
        </div>

        {#each eventData.venueLayout.sections as section, index}
          <div class="p-4 bg-gray-700 rounded-lg">
            <div class="flex justify-between items-center mb-4">
              <h4 class="font-medium text-white">Section {index + 1}</h4>
              <button
                on:click={() => removeSection(index)}
                class="text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Section Name
                </label>
                <input
                  type="text"
                  bind:value={section.name}
                  class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  placeholder="e.g., Orchestra, Balcony"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Capacity
                </label>
                <input
                  type="number"
                  bind:value={section.capacity}
                  min="1"
                  class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  placeholder="100"
                />
              </div>
            </div>
          </div>
        {/each}

        {#if errors.sections}
          <p class="text-red-400 text-sm">{errors.sections}</p>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Navigation Buttons -->
  <div class="flex justify-between mt-8">
    <button
      on:click={prevStep}
      class="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
    >
      Previous
    </button>

    <button
      on:click={nextStep}
      class="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200"
    >
      Next Step
    </button>
  </div>
</div>
