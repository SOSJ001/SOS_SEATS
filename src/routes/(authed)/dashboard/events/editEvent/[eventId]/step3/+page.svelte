<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import StepperProgress from "$lib/components/StepperProgress.svelte";

  // Get the event data from the server
  export let data;

  let eventData = {
    // Step 1 fields
    name: "",
    date: "",
    time: "",
    location: "",
    venue_address: "",
    description: "",

    // Step 2 fields
    category: "",
    tags: [],
    image: null,
    organizer: "",
    contact_email: "",
    website: "",
    social_media: {
      facebook: "",
      twitter: "",
      instagram: "",
    },

    // Step 3 fields
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
  let error = data.error || "";
  let isLoading = true;

  // Reactive statement to handle free event changes
  $: if (eventData.is_free_event !== undefined) {
    handleFreeEventToggle();
  }

  // Reactive validation for ticket quantities vs total capacity
  $: {
    if (eventData.total_capacity && eventData.ticket_types) {
      const totalTicketQuantity = eventData.ticket_types.reduce(
        (sum, ticket) => {
          return sum + (ticket.quantity || 0);
        },
        0
      );

      if (totalTicketQuantity > eventData.total_capacity) {
        errors.ticketQuantityExceedsCapacity = `Total ticket quantity (${totalTicketQuantity}) exceeds event capacity (${eventData.total_capacity})`;
      } else {
        delete errors.ticketQuantityExceedsCapacity;
      }
    }
  }

  $: eventId = $page.params.eventId;

  onMount(() => {
    console.log("Step3 - onMount started");
    console.log("Step3 - Server data:", data);

    // Always load from server data first to get the latest event data
    console.log("Step3 - Loading data from server:", data.event);
    if (data.event) {
      eventData = { ...eventData, ...data.event };
    }

    // Then merge with any localStorage data (for any changes made in this session)
    const savedData = localStorage.getItem("eventEditData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log("Step3 - Merging with localStorage data:", parsed);
      eventData = { ...eventData, ...parsed };
    }

    console.log("Step3 - Final eventData after merge:", eventData);
  });

  function addTicketType() {
    eventData.ticket_types = [
      ...eventData.ticket_types,
      {
        name: "",
        description: "",
        price: eventData.is_free_event ? 0.0 : 10.0, // Database: DECIMAL(10,2)
        quantity: null, // Database: INTEGER
        benefits: [], // Database: TEXT[]
      },
    ];
  }

  function removeTicketType(index) {
    if (eventData.ticket_types.length > 1) {
      eventData.ticket_types = eventData.ticket_types.filter(
        (ticket, i) => i !== index
      );
    }
  }

  function addBenefit(ticketIndex) {
    eventData.ticket_types[ticketIndex].benefits = [
      ...eventData.ticket_types[ticketIndex].benefits,
      "",
    ];
  }

  function removeBenefit(ticketIndex, benefitIndex) {
    eventData.ticket_types[ticketIndex].benefits = eventData.ticket_types[
      ticketIndex
    ].benefits.filter((benefit, i) => i !== benefitIndex);
  }

  function addSection() {
    eventData.venue_sections = [
      ...eventData.venue_sections,
      {
        name: "",
        description: "",
        capacity: null, // Database: INTEGER
        price: eventData.is_free_event ? 0.0 : 10.0, // Database: DECIMAL(10,2)
        seating_chart_data: null, // Database: JSONB
      },
    ];
  }

  function removeSection(index) {
    eventData.venue_sections = eventData.venue_sections.filter(
      (section, i) => i !== index
    );
  }

  // Handle free event toggle
  function handleFreeEventToggle() {
    // Update all existing ticket prices
    eventData.ticket_types.forEach((ticket) => {
      ticket.price = eventData.is_free_event ? 0.0 : ticket.price || 0.0;
    });

    // Update all existing section prices
    eventData.venue_sections.forEach((section) => {
      section.price = eventData.is_free_event ? 0.0 : section.price || 0.0;
    });
  }

  function validateStep() {
    errors = {};

    // Validate ticket types
    eventData.ticket_types.forEach((ticket, index) => {
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

    // Validate max seats per order
    if (
      eventData.seating_options.max_seats_per_order === null ||
      eventData.seating_options.max_seats_per_order <= 0
    ) {
      errors.maxSeatsPerOrder = "Valid max seats per order is required";
    } else if (
      eventData.seating_options.max_seats_per_order > eventData.total_capacity
    ) {
      errors.maxSeatsPerOrder =
        "Max seats per order cannot exceed total capacity";
    }

    // Validate that ticket quantities don't exceed total capacity
    if (eventData.total_capacity && eventData.ticket_types) {
      const totalTicketQuantity = eventData.ticket_types.reduce(
        (sum, ticket) => {
          return sum + (ticket.quantity || 0);
        },
        0
      );

      if (totalTicketQuantity > eventData.total_capacity) {
        errors.ticketQuantityExceedsCapacity = `Total ticket quantity (${totalTicketQuantity}) exceeds event capacity (${eventData.total_capacity}). Please reduce ticket quantities or increase event capacity.`;
      }
    }

    // Validate venue sections for assigned seating
    if (
      eventData.seating_type === "assigned" &&
      eventData.venue_sections.length === 0
    ) {
      errors.sections = "At least one section is required for assigned seating";
    }

    // Validate venue sections if they exist
    eventData.venue_sections.forEach((section, index) => {
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
      console.log("Step3 - Saving data:", eventData);
      localStorage.setItem("eventEditData", JSON.stringify(eventData));
      goto(`/dashboard/events/editEvent/${eventId}/step4`);
    }
  }

  function prevStep() {
    localStorage.setItem("eventEditData", JSON.stringify(eventData));
    goto(`/dashboard/events/editEvent/${eventId}/step2`);
  }

  function goBack() {
    goto(`/dashboard/events/editEvent/${eventId}`);
  }
</script>

<div class="max-w-4xl mx-auto p-4 sm:p-6" in:fade={{ duration: 300 }}>
  <!-- Title -->
  <div class="text-center mb-6 sm:mb-8">
    <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">Edit Event</h1>
  </div>

  <!-- Stepper Progress -->
  <StepperProgress currentStep={3} />

  <!-- Step Title -->
  <div class="mb-6 sm:mb-8">
    <h2 class="text-xl sm:text-3xl font-bold text-white mb-2">
      Ticket Types & Seating
    </h2>
    <p class="text-gray-400 text-sm sm:text-base">
      Update ticket tiers, pricing, and seating configuration for your event.
    </p>
  </div>

  <!-- Form -->
  <div class="bg-gray-800 rounded-xl p-4 sm:p-8 space-y-6 sm:space-y-8">
    <!-- Event Type -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-4">
        Event Type
      </label>
      <div class="flex items-center space-x-6">
        <label class="flex items-center">
          <input
            type="radio"
            bind:group={eventData.is_free_event}
            value={false}
            class="mr-2 text-teal-400 focus:ring-teal-400"
          />
          <span class="text-white">Paid Event</span>
        </label>
        <label class="flex items-center">
          <input
            type="radio"
            bind:group={eventData.is_free_event}
            value={true}
            class="mr-2 text-teal-400 focus:ring-teal-400"
          />
          <span class="text-white">Free Event</span>
        </label>
      </div>
    </div>

    <!-- Seating Type -->
    <div>
      <label
        for="seating_type"
        class="block text-sm font-medium text-gray-300 mb-2"
      >
        Seating Type
      </label>
      <select
        id="seating_type"
        bind:value={eventData.seating_type}
        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
      >
        <option value="general">General Admission</option>
        <option value="assigned">Assigned Seating</option>
        <option value="mixed">Mixed Seating</option>
      </select>
    </div>

    <!-- Total Capacity -->
    <div>
      <label
        for="total_capacity"
        class="block text-sm font-medium text-gray-300 mb-2"
      >
        Total Capacity *
      </label>
      <input
        id="total_capacity"
        type="number"
        bind:value={eventData.total_capacity}
        min="1"
        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors.totalCapacity
          ? 'border-red-500'
          : ''}"
        placeholder="Enter total capacity"
      />
      {#if errors.totalCapacity}
        <p class="text-red-400 text-sm mt-1">{errors.totalCapacity}</p>
      {/if}
      {#if errors.ticketQuantityExceedsCapacity}
        <p class="text-red-400 text-sm mt-1">
          {errors.ticketQuantityExceedsCapacity}
        </p>
      {/if}
    </div>

    <!-- Max Seats Per Order -->
    <div>
      <label
        for="max_seats_per_order"
        class="block text-sm font-medium text-gray-300 mb-2"
      >
        Max Seats Per Order *
      </label>
      <input
        id="max_seats_per_order"
        type="number"
        bind:value={eventData.seating_options.max_seats_per_order}
        min="1"
        max={eventData.total_capacity || 100}
        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors.maxSeatsPerOrder
          ? 'border-red-500'
          : ''}"
        placeholder="Maximum tickets per order"
      />
      <p class="text-gray-400 text-sm mt-1">
        Maximum number of tickets a customer can purchase in a single order
      </p>
      {#if errors.maxSeatsPerOrder}
        <p class="text-red-400 text-sm mt-1">{errors.maxSeatsPerOrder}</p>
      {/if}
    </div>

    <!-- Ticket Types -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <label class="block text-sm font-medium text-gray-300">
          Ticket Types *
        </label>
        <button
          type="button"
          on:click={addTicketType}
          class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 text-sm"
        >
          Add Ticket Type
        </button>
      </div>

      <div class="space-y-6">
        {#each eventData.ticket_types as ticket, ticketIndex}
          <div class="border border-gray-600 rounded-lg p-4">
            <div class="flex justify-between items-center mb-4">
              <h4 class="text-white font-medium">
                Ticket Type {ticketIndex + 1}
              </h4>
              {#if eventData.ticket_types.length > 1}
                <button
                  type="button"
                  on:click={() => removeTicketType(ticketIndex)}
                  class="text-red-400 hover:text-red-300 transition-colors duration-200"
                >
                  Remove
                </button>
              {/if}
            </div>

            <div
              class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6"
            >
              <div>
                <label class="block text-sm text-gray-400 mb-1">Name *</label>
                <input
                  type="text"
                  bind:value={ticket.name}
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors[
                    `ticket${ticketIndex}Name`
                  ]
                    ? 'border-red-500'
                    : ''}"
                  placeholder="e.g., General Admission"
                />
                {#if errors[`ticket${ticketIndex}Name`]}
                  <p class="text-red-400 text-sm mt-1">
                    {errors[`ticket${ticketIndex}Name`]}
                  </p>
                {/if}
              </div>

              <div>
                <label class="block text-sm text-gray-400 mb-1"
                  >Quantity *</label
                >
                <input
                  type="number"
                  bind:value={ticket.quantity}
                  min="1"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors[
                    `ticket${ticketIndex}Quantity`
                  ]
                    ? 'border-red-500'
                    : ''}"
                  placeholder="Number of tickets"
                />
                {#if errors[`ticket${ticketIndex}Quantity`]}
                  <p class="text-red-400 text-sm mt-1">
                    {errors[`ticket${ticketIndex}Quantity`]}
                  </p>
                {/if}
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm text-gray-400 mb-1">Description</label
              >
              <textarea
                bind:value={ticket.description}
                rows="2"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                placeholder="Describe what's included with this ticket"
              ></textarea>
            </div>

            {#if !eventData.is_free_event}
              <div class="mb-4">
                <label class="block text-sm text-gray-400 mb-1">Price *</label>
                <div class="relative">
                  <span class="absolute left-3 top-2 text-gray-400">$</span>
                  <input
                    type="number"
                    bind:value={ticket.price}
                    min="0"
                    step="0.01"
                    class="w-full pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors[
                      `ticket${ticketIndex}Price`
                    ]
                      ? 'border-red-500'
                      : ''}"
                    placeholder="0.00"
                  />
                </div>
                {#if errors[`ticket${ticketIndex}Price`]}
                  <p class="text-red-400 text-sm mt-1">
                    {errors[`ticket${ticketIndex}Price`]}
                  </p>
                {/if}
              </div>
            {/if}

            <!-- Benefits -->
            <div>
              <div class="flex justify-between items-center mb-2">
                <label class="block text-sm text-gray-400">Benefits</label>
                <button
                  type="button"
                  on:click={() => addBenefit(ticketIndex)}
                  class="text-teal-400 hover:text-teal-300 transition-colors duration-200 text-sm"
                >
                  Add Benefit
                </button>
              </div>
              <div class="space-y-2">
                {#each ticket.benefits as benefit, benefitIndex}
                  <div class="flex gap-2">
                    <input
                      type="text"
                      bind:value={ticket.benefits[benefitIndex]}
                      class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="e.g., VIP access, Free parking"
                    />
                    <button
                      type="button"
                      on:click={() => removeBenefit(ticketIndex, benefitIndex)}
                      class="px-3 py-2 text-red-400 hover:text-red-300 transition-colors duration-200"
                    >
                      ×
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Venue Sections (for assigned seating) -->
    {#if eventData.seating_type === "assigned"}
      <div>
        <div class="flex justify-between items-center mb-4">
          <label class="block text-sm font-medium text-gray-300">
            Venue Sections *
          </label>
          <button
            type="button"
            on:click={addSection}
            class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 text-sm"
          >
            Add Section
          </button>
        </div>

        {#if errors.sections}
          <p class="text-red-400 text-sm mb-4">{errors.sections}</p>
        {/if}

        <div class="space-y-4">
          {#each eventData.venue_sections as section, sectionIndex}
            <div class="border border-gray-600 rounded-lg p-4">
              <div class="flex justify-between items-center mb-4">
                <h4 class="text-white font-medium">
                  Section {sectionIndex + 1}
                </h4>
                <button
                  type="button"
                  on:click={() => removeSection(sectionIndex)}
                  class="text-red-400 hover:text-red-300 transition-colors duration-200"
                >
                  Remove
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label class="block text-sm text-gray-400 mb-1">Name *</label>
                  <input
                    type="text"
                    bind:value={section.name}
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors[
                      `section${sectionIndex}Name`
                    ]
                      ? 'border-red-500'
                      : ''}"
                    placeholder="e.g., Orchestra, Balcony"
                  />
                  {#if errors[`section${sectionIndex}Name`]}
                    <p class="text-red-400 text-sm mt-1">
                      {errors[`section${sectionIndex}Name`]}
                    </p>
                  {/if}
                </div>

                <div>
                  <label class="block text-sm text-gray-400 mb-1"
                    >Capacity *</label
                  >
                  <input
                    type="number"
                    bind:value={section.capacity}
                    min="1"
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors[
                      `section${sectionIndex}Capacity`
                    ]
                      ? 'border-red-500'
                      : ''}"
                    placeholder="Number of seats"
                  />
                  {#if errors[`section${sectionIndex}Capacity`]}
                    <p class="text-red-400 text-sm mt-1">
                      {errors[`section${sectionIndex}Capacity`]}
                    </p>
                  {/if}
                </div>
              </div>

              <div class="mt-4">
                <label class="block text-sm text-gray-400 mb-1"
                  >Description</label
                >
                <textarea
                  bind:value={section.description}
                  rows="2"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  placeholder="Describe this section"
                ></textarea>
              </div>

              {#if !eventData.is_free_event}
                <div class="mt-4">
                  <label class="block text-sm text-gray-400 mb-1">Price *</label
                  >
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-gray-400">$</span>
                    <input
                      type="number"
                      bind:value={section.price}
                      min="0"
                      step="0.01"
                      class="w-full pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors[
                        `section${sectionIndex}Price`
                      ]
                        ? 'border-red-500'
                        : ''}"
                      placeholder="0.00"
                    />
                  </div>
                  {#if errors[`section${sectionIndex}Price`]}
                    <p class="text-red-400 text-sm mt-1">
                      {errors[`section${sectionIndex}Price`]}
                    </p>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Seating Options -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-4">
        Seating Options
      </label>
      <div class="space-y-4">
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={eventData.seating_options.allow_seat_selection}
            class="mr-3 text-teal-400 focus:ring-teal-400"
          />
          <span class="text-white">Allow seat selection</span>
        </label>
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={eventData.seating_options.reserved_seating}
            class="mr-3 text-teal-400 focus:ring-teal-400"
          />
          <span class="text-white">Reserved seating</span>
        </label>
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={eventData.seating_options.has_seating_chart}
            class="mr-3 text-teal-400 focus:ring-teal-400"
          />
          <span class="text-white">Has seating chart</span>
        </label>
      </div>

      {#if eventData.seating_options.allow_seat_selection}
        <div class="mt-4">
          <label for="max_seats" class="block text-sm text-gray-400 mb-1">
            Maximum seats per order
          </label>
          <input
            id="max_seats"
            type="number"
            bind:value={eventData.seating_options.max_seats_per_order}
            min="1"
            max="10"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>
      {/if}
    </div>
  </div>

  <!-- Navigation Buttons -->
  <div
    class="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 mt-6 sm:mt-8"
  >
    <button
      on:click={prevStep}
      class="w-full sm:w-auto px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm sm:text-base"
    >
      Previous
    </button>

    <button
      on:click={nextStep}
      class="w-full sm:w-auto px-8 py-3 sm:py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg hover:from-teal-500 hover:to-blue-600 transition-all duration-200 font-medium text-sm sm:text-base"
    >
      Next Step
    </button>
  </div>
</div>
