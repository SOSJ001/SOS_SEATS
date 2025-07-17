<script>
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import StepperProgress from "$lib/components/StepperProgress.svelte";

  let eventData = {
    ticketTypes: [
      {
        name: "General Admission",
        price: "",
        quantity: "",
        description: "",
        benefits: [],
      },
    ],
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

  function addTicketType() {
    eventData.ticketTypes = [
      ...eventData.ticketTypes,
      {
        name: "",
        price: "",
        quantity: "",
        description: "",
        benefits: [],
      },
    ];
  }

  function removeTicketType(index) {
    if (eventData.ticketTypes.length > 1) {
      eventData.ticketTypes = eventData.ticketTypes.filter(
        (_, i) => i !== index
      );
    }
  }

  function addBenefit(ticketIndex) {
    eventData.ticketTypes[ticketIndex].benefits = [
      ...eventData.ticketTypes[ticketIndex].benefits,
      "",
    ];
  }

  function removeBenefit(ticketIndex, benefitIndex) {
    eventData.ticketTypes[ticketIndex].benefits = eventData.ticketTypes[
      ticketIndex
    ].benefits.filter((_, i) => i !== benefitIndex);
  }

  function validateStep() {
    errors = {};

    eventData.ticketTypes.forEach((ticket, index) => {
      if (!ticket.name.trim()) {
        errors[`ticket${index}Name`] = "Ticket name is required";
      }
      if (!ticket.price || parseFloat(ticket.price) < 0) {
        errors[`ticket${index}Price`] = "Valid price is required";
      }
      if (!ticket.quantity || parseInt(ticket.quantity) <= 0) {
        errors[`ticket${index}Quantity`] = "Valid quantity is required";
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
    <h2 class="text-3xl font-bold text-white mb-2">Ticket Types & Pricing</h2>
    <p class="text-gray-400">
      Set up different ticket tiers and pricing for your event.
    </p>
  </div>

  <!-- Ticket Types -->
  <div class="space-y-6">
    {#each eventData.ticketTypes as ticket, ticketIndex}
      <div class="bg-gray-800 rounded-xl p-8">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-semibold text-white">
            Ticket Type {ticketIndex + 1}
          </h3>
          {#if eventData.ticketTypes.length > 1}
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
              Price ($) *
            </label>
            <input
              type="number"
              bind:value={ticket.price}
              min="0"
              step="0.01"
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors[
                `ticket${ticketIndex}Price`
              ]
                ? 'border-red-500'
                : ''}"
              placeholder="0.00"
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
