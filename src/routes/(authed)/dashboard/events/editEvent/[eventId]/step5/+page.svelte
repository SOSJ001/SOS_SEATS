<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import StepperProgress from "$lib/components/StepperProgress.svelte";

  // Get the event data from the server
  export let data;

  let eventData = {};
  let error = data.error || "";
  let isLoading = true;
  let isSaving = false;
  let saveError = "";

  $: eventId = $page.params.eventId;

  onMount(() => {
    console.log("Step5 - onMount started");
    console.log("Step5 - Server data:", data);
    
    // Always load from server data first to get the latest event data
    console.log("Step5 - Loading data from server:", data.event);
    if (data.event) {
      eventData = { ...eventData, ...data.event };
    }
    
    // Then merge with any localStorage data (for any changes made in this session)
    const savedData = localStorage.getItem("eventEditData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log("Step5 - Merging with localStorage data:", parsed);
      eventData = { ...eventData, ...parsed };
    }
    
    console.log("Step5 - Final eventData for preview:", eventData);
    isLoading = false;
  });

  async function saveEvent() {
    try {
      isSaving = true;
      saveError = "";

      // Here you would send the event data to your API to update the event
      // For now, we'll simulate the save process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clear localStorage after successful save
      localStorage.removeItem("eventEditData");

      // Redirect to event details page
      goto(`/dashboard/events/eventDetails?id=${eventId}`);
    } catch (error) {
      console.error("Error saving event:", error);
      saveError = "Failed to save event. Please try again.";
    } finally {
      isSaving = false;
    }
  }

  function prevStep() {
    goto(`/dashboard/events/editEvent/${eventId}/step4`);
  }

  function goBack() {
    goto(`/dashboard/events/editEvent/${eventId}`);
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  }

  function formatDate(dateString) {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatTime(timeString) {
    if (!timeString) return "Not set";
    return timeString;
  }
</script>

<div class="max-w-4xl mx-auto p-4 sm:p-6" in:fade={{ duration: 300 }}>
  <!-- Title -->
  <div class="text-center mb-6 sm:mb-8">
    <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">Edit Event</h1>
  </div>

  <!-- Stepper Progress -->
  <StepperProgress currentStep={5} />

  <!-- Step Title -->
  <div class="mb-6 sm:mb-8">
    <h2 class="text-xl sm:text-3xl font-bold text-white mb-2">
      Review & Save Changes
    </h2>
    <p class="text-gray-400 text-sm sm:text-base">
      Review all your event details before saving the changes.
    </p>
  </div>

  {#if error}
    <div class="bg-red-800 border border-red-600 rounded-lg p-6 text-center mb-6">
      <h3 class="text-xl font-bold text-white mb-2">Error Loading Event</h3>
      <p class="text-red-200 mb-4">{error}</p>
      <button
        on:click={() => goto('/dashboard/events')}
        class="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
      >
        Back to Events
      </button>
    </div>
  {:else if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"
        ></div>
        <p class="text-gray-300">Loading event data...</p>
      </div>
    </div>
  {:else}

  <!-- Review Sections -->
  <div class="space-y-6">
    <!-- Basic Information -->
    <div class="bg-gray-800 rounded-xl p-6">
      <h3 class="text-lg font-medium text-white mb-4">Basic Information</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span class="text-gray-400 text-sm">Event Name:</span>
          <p class="text-white font-medium">{eventData.name || "Not set"}</p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Date:</span>
          <p class="text-white font-medium">{formatDate(eventData.date)}</p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Time:</span>
          <p class="text-white font-medium">{formatTime(eventData.time)}</p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Location:</span>
          <p class="text-white font-medium">
            {eventData.location || "Not set"}
          </p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Category:</span>
          <p class="text-white font-medium">
            {eventData.category || "Not set"}
          </p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Status:</span>
          <p class="text-white font-medium capitalize">
            {eventData.status || "Not set"}
          </p>
        </div>
      </div>
      {#if eventData.description}
        <div class="mt-4">
          <span class="text-gray-400 text-sm">Description:</span>
          <p class="text-white font-medium mt-1">{eventData.description}</p>
        </div>
      {/if}
    </div>

    <!-- Event Details -->
    <div class="bg-gray-800 rounded-xl p-6">
      <h3 class="text-lg font-medium text-white mb-4">Event Details</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span class="text-gray-400 text-sm">Organizer:</span>
          <p class="text-white font-medium">
            {eventData.organizer || "Not set"}
          </p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Contact Email:</span>
          <p class="text-white font-medium">
            {eventData.contact_email || "Not set"}
          </p>
        </div>
        {#if eventData.website}
          <div>
            <span class="text-gray-400 text-sm">Website:</span>
            <p class="text-white font-medium">{eventData.website}</p>
          </div>
        {/if}
        {#if eventData.tags && eventData.tags.length > 0}
          <div>
            <span class="text-gray-400 text-sm">Tags:</span>
            <div class="flex flex-wrap gap-2 mt-1">
              {#each eventData.tags as tag}
                <span
                  class="px-2 py-1 bg-teal-600 text-white text-sm rounded-full"
                  >{tag}</span
                >
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Ticket Information -->
    <div class="bg-gray-800 rounded-xl p-6">
      <h3 class="text-lg font-medium text-white mb-4">Ticket Information</h3>
      <div class="mb-4">
        <span class="text-gray-400 text-sm">Event Type:</span>
        <p class="text-white font-medium">
          {eventData.is_free_event ? "Free Event" : "Paid Event"}
        </p>
      </div>
      <div class="mb-4">
        <span class="text-gray-400 text-sm">Seating Type:</span>
        <p class="text-white font-medium capitalize">
          {eventData.seating_type || "Not set"}
        </p>
      </div>
      <div class="mb-4">
        <span class="text-gray-400 text-sm">Total Capacity:</span>
        <p class="text-white font-medium">
          {eventData.total_capacity || "Not set"}
        </p>
      </div>

      {#if eventData.ticket_types && eventData.ticket_types.length > 0}
        <div>
          <span class="text-gray-400 text-sm">Ticket Types:</span>
          <div class="mt-2 space-y-2">
            {#each eventData.ticket_types as ticket}
              <div class="border border-gray-600 rounded-lg p-3">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="text-white font-medium">{ticket.name}</p>
                    {#if ticket.description}
                      <p class="text-gray-400 text-sm">{ticket.description}</p>
                    {/if}
                  </div>
                  <div class="text-right">
                    <p class="text-white font-medium">
                      {formatCurrency(ticket.price)}
                    </p>
                    <p class="text-gray-400 text-sm">
                      Qty: {ticket.quantity || "Not set"}
                    </p>
                  </div>
                </div>
                {#if ticket.benefits && ticket.benefits.length > 0}
                  <div class="mt-2">
                    <p class="text-gray-400 text-sm">Benefits:</p>
                    <ul class="text-white text-sm mt-1">
                      {#each ticket.benefits as benefit}
                        <li>• {benefit}</li>
                      {/each}
                    </ul>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Settings -->
    <div class="bg-gray-800 rounded-xl p-6">
      <h3 class="text-lg font-medium text-white mb-4">Event Settings</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span class="text-gray-400 text-sm">Visibility:</span>
          <p class="text-white font-medium capitalize">
            {eventData.visibility || "Not set"}
          </p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Registration Required:</span>
          <p class="text-white font-medium">
            {eventData.registration_required ? "Yes" : "No"}
          </p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Allow Waitlist:</span>
          <p class="text-white font-medium">
            {eventData.allow_waitlist ? "Yes" : "No"}
          </p>
        </div>
        <div>
          <span class="text-gray-400 text-sm">Allow Refunds:</span>
          <p class="text-white font-medium">
            {eventData.allow_refunds ? "Yes" : "No"}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Error Message -->
  {#if saveError}
    <div class="bg-red-800 border border-red-600 rounded-lg p-4 mt-6">
      <p class="text-red-200">{saveError}</p>
    </div>
  {/if}

  <!-- Navigation Buttons -->
  <div
    class="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 mt-6 sm:mt-8"
  >
    <button
      on:click={prevStep}
      class="w-full sm:w-auto px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm sm:text-base"
      disabled={isSaving}
    >
      Previous
    </button>

    <button
      on:click={saveEvent}
      class="w-full sm:w-auto px-8 py-3 sm:py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg hover:from-teal-500 hover:to-blue-600 transition-all duration-200 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isSaving}
    >
      {#if isSaving}
        <div class="flex items-center">
          <div
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
          ></div>
          Saving...
        </div>
      {:else}
        Save Changes
      {/if}
    </button>
  </div>
  {/if}
</div>
