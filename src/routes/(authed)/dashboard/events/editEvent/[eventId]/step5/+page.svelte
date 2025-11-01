<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import StepperProgress from "$lib/components/StepperProgress.svelte";
  import TicketDesignEditor from "$lib/components/TicketDesignEditor.svelte";
  import { defaultTicketDesignConfig } from "$lib/store";

  // Get the event data from the server
  export let data;

  /** @type {any} */
  let eventData = {};
  let error = data.error || "";
  let isLoading = true;
  let isSaving = false;
  let isPublishing = false;
  let saveError = "";
  let saveSuccess = false;
  let publishError = "";
  let publishSuccess = false;

  // Ticket design configuration
  /** @type {import('$lib/store').TicketDesignConfig} */
  let ticketDesignConfig = defaultTicketDesignConfig;

  $: eventId = $page.params.eventId;

  onMount(() => {
    // Always load from server data first to get the latest event data
    if (data.event) {
      eventData = { ...eventData, ...data.event };
    }

    // Then merge with any localStorage data (for any changes made in this session)
    const savedData = localStorage.getItem("eventEditData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      eventData = { ...eventData, ...parsed };

      // Ensure imagePreview from localStorage takes precedence for display
      if (parsed.imagePreview) {
        eventData.imagePreview = parsed.imagePreview;
      }
    }

    // Initialize ticket design config from event data
    // Priority: localStorage > server data > default
    if (eventData.ticket_design_config) {
      ticketDesignConfig =
        /** @type {import('$lib/store').TicketDesignConfig} */ (
          eventData.ticket_design_config
        );

      // Ensure textBox.enabled exists for backward compatibility
      if (
        ticketDesignConfig.textBox &&
        ticketDesignConfig.textBox.enabled === undefined
      ) {
        ticketDesignConfig.textBox.enabled = true;
      }
    } else {
      ticketDesignConfig = defaultTicketDesignConfig;
    }

    isLoading = false;
  });

  async function saveEvent() {
    isSaving = true;
    saveError = "";

    try {
      // Convert image to base64 if it exists and is a File
      let imageBase64 = null;
      if (eventData.image && eventData.image instanceof File) {
        imageBase64 = await convertFileToBase64(eventData.image);
      } else if (eventData.imagePreview) {
        // If we have imagePreview (base64), use it directly
        imageBase64 = eventData.imagePreview;
      }

      // Prepare the event data for the database
      const eventDataForDB = {
        ...eventData,
        image: imageBase64, // Replace File object with base64 string
        ticket_design_config: ticketDesignConfig, // Ensure design config is included
        updated_at: new Date().toISOString(),
      };

      // Send to API
      const response = await fetch(`/updateEventApi/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventDataForDB),
      });

      const result = await response.json();
      if (result.success) {
        // Clear localStorage
        localStorage.removeItem("eventEditData");
        saveSuccess = true;

        // Redirect to event details page after a short delay
        setTimeout(() => {
          goto(`/dashboard/events/eventDetails?id=${eventId}`);
        }, 2000);
      } else {
        saveError = "Error saving event: " + result.error;
      }
    } catch (error) {
      saveError = "Error saving event. Please try again.";
    } finally {
      isSaving = false;
    }
  }

  async function publishEvent() {
    isPublishing = true;
    publishError = "";

    try {
      // Convert image to base64 if it exists and is a File
      let imageBase64 = null;
      if (eventData.image && eventData.image instanceof File) {
        imageBase64 = await convertFileToBase64(eventData.image);
      } else if (eventData.imagePreview) {
        // If we have imagePreview (base64), use it directly
        imageBase64 = eventData.imagePreview;
      }

      // Prepare the complete event data for publishing
      const publishData = {
        ...eventData,
        image: imageBase64, // Replace File object with base64 string
        ticket_design_config: ticketDesignConfig, // Ensure design config is included
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Send to API
      const response = await fetch(`/updateEventApi/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(publishData),
      });

      const result = await response.json();
      if (result.success) {
        // Clear localStorage
        localStorage.removeItem("eventEditData");
        publishSuccess = true;

        // Redirect to event details page after a short delay
        setTimeout(() => {
          goto(`/dashboard/events/eventDetails?id=${eventId}`);
        }, 2000);
      } else {
        publishError = "Error publishing event: " + result.error;
      }
    } catch (error) {
      publishError = "Error publishing event. Please try again.";
    } finally {
      isPublishing = false;
    }
  }

  // Helper function to convert File to base64
  /** @param {File} file */
  function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function prevStep() {
    goto(`/dashboard/events/editEvent/${eventId}/step4`);
  }

  function goBack() {
    goto(`/dashboard/events/editEvent/${eventId}`);
  }

  /** @param {number} amount */
  function formatCurrency(amount) {
    return `NLe ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0)}`;
  }

  /** @param {string} dateString */
  function formatDate(dateString) {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /** @param {string} timeString */
  function formatTime(timeString) {
    if (!timeString) return "Not set";
    return timeString;
  }

  // Handle ticket design config changes
  /** @param {import('$lib/store').TicketDesignConfig} newConfig */
  function handleDesignConfigChange(newConfig) {
    ticketDesignConfig = newConfig;
    eventData.ticket_design_config = newConfig;

    // Save to localStorage for persistence
    localStorage.setItem("eventEditData", JSON.stringify(eventData));
  }

  /**
   * Navigate to a specific edit step
   * @param {number} step
   */
  function editStep(step) {
    goto(`/dashboard/events/editEvent/${eventId}/step${step}`);
  }
</script>

<div class="max-w-6xl mx-auto p-2 sm:p-4" in:fade={{ duration: 300 }}>
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
    <div
      class="bg-red-800 border border-red-600 rounded-lg p-6 text-center mb-6"
    >
      <h3 class="text-xl font-bold text-white mb-2">Error Loading Event</h3>
      <p class="text-red-200 mb-4">{error}</p>
      <button
        on:click={() => goto("/dashboard/events")}
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
    <!-- Success Message -->
    {#if saveSuccess}
      <div
        class="bg-green-800 border border-green-600 rounded-lg p-6 text-center mt-6"
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
        <h3 class="text-xl sm:text-2xl font-bold text-white mb-2">
          Event Updated Successfully!
        </h3>
        <p class="text-green-200 text-sm sm:text-base">
          Your event has been updated and saved.
        </p>
      </div>
    {:else if publishSuccess}
      <!-- Publish Success Message -->
      <div
        class="bg-green-800 border border-green-600 rounded-lg p-6 text-center mt-6"
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
        <h3 class="text-xl sm:text-2xl font-bold text-white mb-2">
          Event Published Successfully!
        </h3>
        <p class="text-green-200 text-sm sm:text-base">
          Your event has been published and is now live.
        </p>
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
              <p class="text-white font-medium">
                {eventData.name || "Not set"}
              </p>
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
        <div class="bg-gray-800 rounded-xl p-3 sm:p-6 md:p-8">
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6"
          >
            <h2 class="text-base sm:text-lg md:text-xl font-bold text-white">
              Event Details
            </h2>
            <button
              on:click={() => editStep(2)}
              class="w-full sm:w-auto px-3 sm:px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 text-xs sm:text-sm"
            >
              Edit Step 2
            </button>
          </div>
          <div class="space-y-3 sm:space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <span class="text-gray-400 text-xs sm:text-sm">Category:</span>
                <p
                  class="text-white font-medium text-xs sm:text-sm md:text-base break-words"
                >
                  {eventData.category || "Not set"}
                </p>
              </div>
              <div>
                <span class="text-gray-400 text-xs sm:text-sm">Organizer:</span>
                <p
                  class="text-white font-medium text-xs sm:text-sm md:text-base break-words"
                >
                  {eventData.organizer || "Not set"}
                </p>
              </div>
              <div>
                <span class="text-gray-400 text-xs sm:text-sm">Website:</span>
                <p
                  class="text-white font-medium text-xs sm:text-sm md:text-base break-words"
                >
                  {eventData.website || "Not set"}
                </p>
              </div>
            </div>

            {#if eventData.tags && eventData.tags.length > 0}
              <div>
                <span class="text-gray-400 text-xs sm:text-sm">Tags:</span>
                <div class="flex flex-wrap gap-1 sm:gap-2 mt-1">
                  {#each eventData.tags as tag}
                    <span
                      class="px-2 sm:px-3 py-1 bg-teal-500 text-white text-xs sm:text-sm rounded-full"
                      >{tag}</span
                    >
                  {/each}
                </div>
              </div>
            {/if}

            <div>
              <span class="text-gray-400 text-xs sm:text-sm md:text-base"
                >Event Image:</span
              >
              <div class="mt-2">
                {#if eventData.imagePreview}
                  <img
                    src={eventData.imagePreview}
                    alt="Event preview"
                    class="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 object-cover rounded-lg border border-gray-600"
                  />
                {:else if eventData.image}
                  <div
                    class="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gray-700 rounded-lg flex items-center justify-center"
                  >
                    <svg
                      class="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                {:else}
                  <span class="text-gray-500 text-xs sm:text-sm"
                    >No image uploaded</span
                  >
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Ticket Types & Seating -->
        <div class="bg-gray-800 rounded-xl p-3 sm:p-6 md:p-8">
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6"
          >
            <h2 class="text-base sm:text-lg md:text-xl font-bold text-white">
              Ticket Types & Seating
            </h2>
            <button
              on:click={() => editStep(3)}
              class="w-full sm:w-auto px-3 sm:px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 text-xs sm:text-sm"
            >
              Edit Step 3
            </button>
          </div>

          <!-- Ticket Types Section -->
          <div class="mb-4 sm:mb-6">
            <div
              class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4"
            >
              <h3 class="text-base sm:text-lg font-semibold text-white">
                Ticket Types
              </h3>
              {#if eventData.is_free_event}
                <span
                  class="px-2 sm:px-3 py-1 bg-green-500 text-white text-xs sm:text-sm rounded-full"
                >
                  Free Event
                </span>
              {/if}
            </div>
            <div class="space-y-3 sm:space-y-4">
              {#if eventData.ticket_types && eventData.ticket_types.length > 0}
                {#each eventData.ticket_types as ticket}
                  <div class="p-3 sm:p-4 bg-gray-700 rounded-lg">
                    <div
                      class="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-3"
                    >
                      <div class="flex-1 min-w-0">
                        <h4
                          class="font-medium text-white text-xs sm:text-sm md:text-base break-words"
                        >
                          {ticket.name}
                        </h4>
                        <p class="text-gray-400 text-xs sm:text-sm break-words">
                          {ticket.description}
                        </p>
                        {#if ticket.benefits && ticket.benefits.length > 0}
                          <div class="mt-2">
                            <span class="text-gray-400 text-xs">Benefits:</span>
                            <ul class="text-gray-300 text-xs mt-1 space-y-1">
                              {#each ticket.benefits as benefit}
                                <li class="break-words">• {benefit}</li>
                              {/each}
                            </ul>
                          </div>
                        {/if}
                      </div>
                      <div class="text-right sm:text-left flex-shrink-0">
                        <p
                          class="text-white font-semibold text-xs sm:text-sm md:text-base"
                        >
                          {formatCurrency(ticket.price)}
                        </p>
                        <p class="text-gray-400 text-xs sm:text-sm">
                          {ticket.quantity} available
                        </p>
                      </div>
                    </div>
                  </div>
                {/each}
              {:else}
                <p class="text-gray-400 text-xs sm:text-sm">
                  No ticket types configured
                </p>
              {/if}
            </div>
          </div>

          <!-- Seating & Capacity Section -->
          <div class="border-t border-gray-700 pt-4 sm:pt-6">
            <h3
              class="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4"
            >
              Seating & Capacity
            </h3>
            <div class="space-y-3 sm:space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <span class="text-gray-400 text-xs sm:text-sm"
                    >Seating Type:</span
                  >
                  <p
                    class="text-white font-medium capitalize text-xs sm:text-sm md:text-base"
                  >
                    {eventData.seating_type || "Not set"}
                  </p>
                </div>
                <div>
                  <span class="text-gray-400 text-xs sm:text-sm"
                    >Total Capacity:</span
                  >
                  <p
                    class="text-white font-medium text-xs sm:text-sm md:text-base"
                  >
                    {eventData.total_capacity || "Not set"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Event Settings -->
        <div class="bg-gray-800 rounded-xl p-3 sm:p-6 md:p-8">
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6"
          >
            <h2 class="text-base sm:text-lg md:text-xl font-bold text-white">
              Event Settings
            </h2>
            <button
              on:click={() => editStep(4)}
              class="w-full sm:w-auto px-3 sm:px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 text-xs sm:text-sm"
            >
              Edit Step 4
            </button>
          </div>
          <div class="space-y-3 sm:space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <span class="text-gray-400 text-xs sm:text-sm"
                  >Audience Type:</span
                >
                <p
                  class="text-white font-medium capitalize text-xs sm:text-sm md:text-base"
                >
                  {eventData.audience_type?.replace("-", " ") || "Not set"}
                </p>
              </div>
              <div>
                <span class="text-gray-400 text-xs sm:text-sm"
                  >Event Visibility:</span
                >
                <p
                  class="text-white font-medium capitalize text-xs sm:text-sm md:text-base"
                >
                  {eventData.event_visibility?.replace("-", " ") || "Not set"}
                </p>
              </div>
            </div>
          </div>
          <!-- <div>
            <span class="text-gray-400 text-sm">Registration Required:</span>
            <p class="text-white font-medium">
              {eventData.registration_required ? "Yes" : "No"}
            </p>
          </div> -->
          <!-- <div>
            <span class="text-gray-400 text-sm">Allow Waitlist:</span>
            <p class="text-white font-medium">
              {eventData.allow_waitlist ? "Yes" : "No"}
            </p>
          </div> -->
          <!-- <div>
            <span class="text-gray-400 text-sm">Allow Refunds:</span>
            <p class="text-white font-medium">
              {eventData.allow_refunds ? "Yes" : "No"}
            </p>
          </div> -->
        </div>
      </div>

      <!-- Ticket Design Editor -->
      <div class="bg-gray-800 rounded-xl p-2">
        <h3 class="text-lg font-medium text-white mb-4">Ticket Design</h3>
        <p class="text-gray-400 text-sm mb-6">
          Customize the appearance of your event tickets with colors, fonts, and
          layout options.
        </p>
        <TicketDesignEditor
          bind:designConfig={ticketDesignConfig}
          {eventData}
          onConfigChange={handleDesignConfigChange}
        />
      </div>
    {/if}

    <!-- Error Messages -->
    {#if saveError}
      <div class="bg-red-800 border border-red-600 rounded-lg p-4 mt-6">
        <p class="text-red-200">{saveError}</p>
      </div>
    {/if}

    {#if publishError}
      <div class="bg-red-800 border border-red-600 rounded-lg p-4 mt-6">
        <p class="text-red-200">{publishError}</p>
      </div>
    {/if}

    <!-- Navigation Buttons -->
    <div
      class="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 mt-6 sm:mt-8"
    >
      <button
        on:click={prevStep}
        class="w-full sm:w-auto px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm sm:text-base"
        disabled={isSaving || isPublishing}
      >
        Previous
      </button>

      <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button
          on:click={saveEvent}
          class="w-full sm:w-auto px-8 py-3 sm:py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg hover:from-teal-500 hover:to-blue-600 transition-all duration-200 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving || isPublishing}
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

        {#if eventData.status === "draft"}
          <button
            on:click={publishEvent}
            class="w-full sm:w-auto px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving || isPublishing}
          >
            {#if isPublishing}
              <div class="flex items-center">
                <div
                  class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                ></div>
                Publishing...
              </div>
            {:else}
              Publish Event
            {/if}
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>
