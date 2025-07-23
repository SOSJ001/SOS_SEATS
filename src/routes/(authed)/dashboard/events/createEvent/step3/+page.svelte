<script lang="ts">
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import StepperProgress from "$lib/components/StepperProgress.svelte";

  let eventData: any = {
    // Event-level fields for database
    is_free_event: false, // Database field name
    seating_type: "general", // Database field name: general, assigned, mixed
    total_capacity: null, // Database field name - will be converted to integer

    // Ticket types for database
    ticket_types: [
      {
        name: "General Admission",
        description: "",
        price: 0.0, // Database: DECIMAL(10,2)
        quantity: null, // Database: INTEGER
        benefits: [], // Database: TEXT[]
      },
    ],

    // Venue sections for database
    venue_sections: [], // Database: separate table

    // Seating options for database
    seating_options: {
      allow_seat_selection: false, // Database field name
      max_seats_per_order: 4, // Database: INTEGER
      reserved_seating: false, // Database field name
      has_seating_chart: false, // Database field name
    },
  };

  let errors: Record<string, string> = {};

  // Reactive statement to handle free event changes
  $: if (eventData.is_free_event !== undefined) {
    handleFreeEventToggle();
  }

  onMount(() => {
    // Load data from previous steps
    const savedData = localStorage.getItem("eventCreationData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      eventData = { ...eventData, ...parsed };
    }
  });

  function addTicketType() {
    eventData.ticket_types = [
      ...eventData.ticket_types,
      {
        name: "",
        description: "",
        price: eventData.is_free_event ? 0.0 : 0.0, // Database: DECIMAL(10,2)
        quantity: null, // Database: INTEGER
        benefits: [], // Database: TEXT[]
      },
    ];
  }

  function removeTicketType(index: number) {
    if (eventData.ticket_types.length > 1) {
      eventData.ticket_types = eventData.ticket_types.filter(
        (ticket: any, i: number) => i !== index
      );
    }
  }

  function addBenefit(ticketIndex: number) {
    eventData.ticket_types[ticketIndex].benefits = [
      ...eventData.ticket_types[ticketIndex].benefits,
      "",
    ];
  }

  function removeBenefit(ticketIndex: number, benefitIndex: number) {
    eventData.ticket_types[ticketIndex].benefits = eventData.ticket_types[
      ticketIndex
    ].benefits.filter((benefit: any, i: number) => i !== benefitIndex);
  }

  function addSection() {
    eventData.venue_sections = [
      ...eventData.venue_sections,
      {
        name: "",
        description: "",
        capacity: null, // Database: INTEGER
        price: eventData.is_free_event ? 0.0 : 0.0, // Database: DECIMAL(10,2)
        seating_chart_data: null, // Database: JSONB
      },
    ];
  }

  function removeSection(index: number) {
    eventData.venue_sections = eventData.venue_sections.filter(
      (section: any, i: number) => i !== index
    );
  }

  // Handle free event toggle
  function handleFreeEventToggle() {
    // Update all existing ticket prices
    eventData.ticket_types.forEach((ticket: any) => {
      ticket.price = eventData.is_free_event ? 0.0 : 0.0;
    });

    // Update all existing section prices
    eventData.venue_sections.forEach((section: any) => {
      section.price = eventData.is_free_event ? 0.0 : 0.0;
    });
  }

  function validateStep() {
    errors = {};

    // Validate ticket types
    eventData.ticket_types.forEach((ticket: any, index: number) => {
      if (!ticket.name.trim()) {
        errors[`ticket${index}Name`] = "Ticket name is required";
      }
      if (!eventData.is_free_event) {
        if (ticket.price === null || ticket.price < 0) {
          errors[`ticket${index}Price`] = "Valid price is required";
        }
      }
      if (ticket.quantity === null || ticket.quantity <= 0) {
        errors[`ticket${index}Quantity`] = "Valid quantity is required";
      }
    });

    // Validate total capacity
    if (eventData.total_capacity === null || eventData.total_capacity <= 0) {
      errors.totalCapacity = "Valid total capacity is required";
    }

    // Validate venue sections for assigned seating
    if (
      eventData.seating_type === "assigned" &&
      eventData.venue_sections.length === 0
    ) {
      errors.sections = "At least one section is required for assigned seating";
    }

    // Validate venue sections if they exist
    eventData.venue_sections.forEach((section: any, index: number) => {
      if (!section.name.trim()) {
        errors[`section${index}Name`] = "Section name is required";
      }
      if (section.capacity === null || section.capacity <= 0) {
        errors[`section${index}Capacity`] = "Valid capacity is required";
      }
      if (!eventData.is_free_event) {
        if (section.price === null || section.price < 0) {
          errors[`section${index}Price`] = "Valid price is required";
        }
      }
    });

    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (validateStep()) {
      localStorage.setItem("eventCreationData", JSON.stringify(eventData));
      goto("/dashboard/events/createEvent/step4");
    }
  }

  function prevStep() {
    localStorage.setItem("eventCreationData", JSON.stringify(eventData));
    goto("/dashboard/events/createEvent/step2");
  }
</script>

<div class="max-w-6xl mx-auto p-6" in:fade={{ duration: 300 }}>
  <!-- Title -->
  <div class="text-center mb-8">
    <h1 class="text-3xl font-bold text-white mb-2">Create New Event</h1>
  </div>

  <!-- Stepper Progress -->
  <StepperProgress currentStep={3} />

  <!-- Step Title -->
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-white mb-2">Ticket Types & Seating</h2>
    <p class="text-gray-400">
      Set up different ticket tiers, pricing, and seating configuration for your
      event.
    </p>
  </div>

  <!-- Ticket Types -->
  <div class="space-y-6 mb-8">
    <h3 class="text-2xl font-semibold text-white mb-4">
      Ticket Types & Pricing
    </h3>

    <!-- Free Event Toggle -->
    <div class="bg-gray-800 rounded-xl p-6">
      <label class="block text-sm font-medium text-gray-300 mb-4">
        Is this a free event?
      </label>
      <div class="flex gap-6">
        <label class="flex items-center">
          <input
            type="radio"
            bind:group={eventData.is_free_event}
            value={true}
            class="w-4 h-4 text-teal-400 bg-gray-700 border-gray-600 focus:ring-teal-400 focus:ring-2"
          />
          <span class="ml-2 text-gray-300">Yes</span>
        </label>
        <label class="flex items-center">
          <input
            type="radio"
            bind:group={eventData.is_free_event}
            value={false}
            class="w-4 h-4 text-teal-400 bg-gray-700 border-gray-600 focus:ring-teal-400 focus:ring-2"
          />
          <span class="ml-2 text-gray-300">No</span>
        </label>
      </div>
    </div>

    {#each eventData.ticket_types as ticket, ticketIndex}
      <div class="bg-gray-800 rounded-xl p-8">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-semibold text-white">
            Ticket Type {ticketIndex + 1}
          </h3>
          {#if eventData.ticket_types.length > 1}
            <button
              on:click={() => removeTicketType(ticketIndex)}
              class="text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          {/if}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Ticket Name -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Ticket Name *
            </label>
            <input
              type="text"
              bind:value={ticket.name}
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors[
                `ticket${ticketIndex}Name`
              ]
                ? 'border-red-500'
                : ''}"
              placeholder="e.g., General Admission, VIP, Early Bird"
            />
            {#if errors[`ticket${ticketIndex}Name`]}
              <p class="text-red-400 text-sm mt-1">
                {errors[`ticket${ticketIndex}Name`]}
              </p>
            {/if}
          </div>

          <!-- Price -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Price {eventData.is_free_event ? "(Free)" : "($) *"}
            </label>
            <input
              type="number"
              bind:value={ticket.price}
              min="0"
              step="0.01"
              disabled={eventData.is_free_event}
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors[
                `ticket${ticketIndex}Price`
              ]
                ? 'border-red-500'
                : ''} {eventData.is_free_event
                ? 'opacity-50 cursor-not-allowed'
                : ''}"
              placeholder={eventData.is_free_event ? "0.00" : "0.00"}
            />
            {#if errors[`ticket${ticketIndex}Price`]}
              <p class="text-red-400 text-sm mt-1">
                {errors[`ticket${ticketIndex}Price`]}
              </p>
            {/if}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Quantity -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Available Quantity *
            </label>
            <input
              type="number"
              bind:value={ticket.quantity}
              min="1"
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors[
                `ticket${ticketIndex}Quantity`
              ]
                ? 'border-red-500'
                : ''}"
              placeholder="100"
            />
            {#if errors[`ticket${ticketIndex}Quantity`]}
              <p class="text-red-400 text-sm mt-1">
                {errors[`ticket${ticketIndex}Quantity`]}
              </p>
            {/if}
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              bind:value={ticket.description}
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              placeholder="Brief description of this ticket type"
            />
          </div>
        </div>

        <!-- Benefits -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Benefits/Features
          </label>
          <div class="space-y-2">
            {#each ticket.benefits as benefit, benefitIndex}
              <div class="flex gap-2">
                <input
                  type="text"
                  bind:value={ticket.benefits[benefitIndex]}
                  class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
                  placeholder="e.g., Priority seating, Meet & greet"
                />
                <button
                  on:click={() => removeBenefit(ticketIndex, benefitIndex)}
                  class="px-3 py-2 text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            {/each}
            <button
              on:click={() => addBenefit(ticketIndex)}
              class="text-teal-400 hover:text-teal-300 text-sm"
            >
              + Add Benefit
            </button>
          </div>
        </div>
      </div>
    {/each}

    <!-- Add Ticket Type Button -->
    <div class="text-center">
      <button
        on:click={addTicketType}
        class="px-6 py-3 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-teal-400 hover:text-teal-400 transition-colors duration-200"
      >
        + Add Another Ticket Type
      </button>
    </div>
  </div>

  <!-- Seating & Capacity -->
  <div class="bg-gray-800 rounded-xl p-8 space-y-8">
    <h3 class="text-2xl font-semibold text-white mb-4">Seating & Capacity</h3>

    <!-- Seating Type -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-4">
        Seating Type
      </label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label class="relative">
          <input
            type="radio"
            bind:group={eventData.seating_type}
            value="general"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.seating_type ===
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
            bind:group={eventData.seating_type}
            value="assigned"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.seating_type ===
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
            bind:group={eventData.seating_type}
            value="mixed"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.seating_type ===
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

    <!-- Capacity Settings -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label
          for="totalCapacity"
          class="block text-sm font-medium text-gray-300 mb-2"
        >
          Total Capacity *
        </label>
        <input
          id="totalCapacity"
          type="number"
          bind:value={eventData.total_capacity}
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

      <div>
        <label
          for="maxSeatsPerOrder"
          class="block text-sm font-medium text-gray-300 mb-2"
        >
          Max Seats Per Order
        </label>
        <input
          id="maxSeatsPerOrder"
          type="number"
          bind:value={eventData.seating_options.max_seats_per_order}
          min="1"
          max="10"
          class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          placeholder="4"
        />
      </div>
    </div>

    <!-- Seating Options -->
    <div class="space-y-4">
      <div class="flex items-center">
        <input
          id="allowSeatSelection"
          type="checkbox"
          bind:checked={eventData.seating_options.allow_seat_selection}
          class="w-4 h-4 text-teal-400 bg-gray-700 border-gray-600 rounded focus:ring-teal-400 focus:ring-2"
        />
        <label
          for="allowSeatSelection"
          class="ml-2 text-sm font-medium text-gray-300"
        >
          Allow seat selection
        </label>
      </div>

      <div class="flex items-center">
        <input
          id="reservedSeating"
          type="checkbox"
          bind:checked={eventData.seating_options.reserved_seating}
          class="w-4 h-4 text-teal-400 bg-gray-700 border-gray-600 rounded focus:ring-teal-400 focus:ring-2"
        />
        <label
          for="reservedSeating"
          class="ml-2 text-sm font-medium text-gray-300"
        >
          Reserved seating
        </label>
      </div>
    </div>

    <!-- Venue Sections (for assigned seating) -->
    {#if eventData.seating_type === "assigned"}
      <div>
        <div class="flex justify-between items-center mb-4">
          <label class="block text-sm font-medium text-gray-300">
            Venue Sections
          </label>
          <button
            on:click={addSection}
            class="text-teal-400 hover:text-teal-300 text-sm"
          >
            + Add Section
          </button>
        </div>

        {#if eventData.venue_sections.length > 0}
          <div class="space-y-4">
            {#each eventData.venue_sections as section, sectionIndex}
              <div class="p-4 bg-gray-700 rounded-lg">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="font-medium text-white">
                    Section {sectionIndex + 1}
                  </h4>
                  <button
                    on:click={() => removeSection(sectionIndex)}
                    class="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-400 mb-1">
                      Section Name
                    </label>
                    <input
                      type="text"
                      bind:value={section.name}
                      class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
                      placeholder="e.g., Orchestra, Balcony"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-gray-400 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      bind:value={section.capacity}
                      min="1"
                      class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-gray-400 mb-1">
                      Price {eventData.is_free_event ? "(Free)" : "($)"}
                    </label>
                    <input
                      type="number"
                      bind:value={section.price}
                      min="0"
                      step="0.01"
                      disabled={eventData.is_free_event}
                      class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm {eventData.is_free_event
                        ? 'opacity-50 cursor-not-allowed'
                        : ''}"
                      placeholder={eventData.is_free_event ? "0.00" : "50.00"}
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-gray-400 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      bind:value={section.description}
                      class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
                      placeholder="Section description"
                    />
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div
            class="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg"
          >
            <p class="text-gray-400">No sections added yet</p>
            <button
              on:click={addSection}
              class="mt-2 text-teal-400 hover:text-teal-300"
            >
              Add your first section
            </button>
          </div>
        {/if}

        {#if errors.sections}
          <p class="text-red-400 text-sm mt-2">{errors.sections}</p>
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
      class="px-8 py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg hover:from-teal-500 hover:to-blue-600 transition-all duration-200 font-medium"
    >
      Next Step
    </button>
  </div>
</div>
