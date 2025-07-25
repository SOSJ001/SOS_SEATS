<script lang="ts">
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import StepperProgress from "$lib/components/StepperProgress.svelte";

  interface EventData {
    // Step 1 data
    name?: string;
    date?: string;
    time?: string;
    location?: string;
    venue_address?: string;
    description?: string;

    // Step 2 data
    category?: string;
    tags?: string[];
    image?: File | string;
    imagePreview?: string;
    organizer?: string;
    contact_email?: string;
    website?: string;
    social_media?: {
      facebook: string;
      twitter: string;
      instagram: string;
    };

    // Step 3 data (Ticket Types & Seating)
    is_free_event?: boolean;
    ticket_types?: Array<{
      name: string;
      price: number;
      quantity: number;
      description: string;
      benefits: string[];
    }>;
    seating_type?: string;
    total_capacity?: number;
    venue_sections?: Array<{
      name: string;
      capacity: number;
      price: number;
      description: string;
      seating_chart_data?: any;
    }>;
    seating_options?: {
      allow_seat_selection: boolean;
      max_seats_per_order: number;
      reserved_seating: boolean;
      has_seating_chart: boolean;
    };

    // Step 4 data (Event Settings)
    audience_type?: string;
    event_visibility?: string;
  }

  let eventData: EventData = {};
  let isPublishing = false;
  let isSavingDraft = false;
  let publishSuccess = false;
  let draftSuccess = false;

  onMount(() => {
    // Load all data from previous steps
    const savedData = localStorage.getItem("eventCreationData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log("Step5 - Loading saved data:", parsed);
      eventData = parsed;
      console.log("Step5 - Final eventData:", eventData);
    } else {
      console.log("Step5 - No saved data found in localStorage");
    }
  });

  function formatDate(dateString: string | undefined): string {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatTime(timeString: string | undefined): string {
    if (!timeString) return "Not set";
    return timeString;
  }

  function formatPrice(price: string | number | undefined): string {
    if (!price || parseFloat(price.toString()) === 0) return "Free";
    return `$${parseFloat(price.toString()).toFixed(2)}`;
  }

  async function publishEvent() {
    isPublishing = true;

    try {
      console.log("Step5 - Publishing event data:", eventData);

      // Prepare the event data for the database
      const eventDataForDB = {
        ...eventData,
        status: "published", // Set status to published, not draft
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      console.log("Step5 - Event data for DB:", eventDataForDB);

      // Send to API
      const response = await fetch("/createEventApi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventDataForDB),
      });

      const result = await response.json();
      console.log("Step5 - API response:", result);

      if (result.success) {
        // Clear localStorage
        localStorage.removeItem("eventCreationData");
        publishSuccess = true;

        // Redirect to events page after a short delay
        setTimeout(() => {
          goto("/dashboard/events");
        }, 2000);
      } else {
        console.error("Error publishing event:", result.error);
        alert("Error publishing event: " + result.error);
      }
    } catch (error) {
      console.error("Error publishing event:", error);
      alert("Error publishing event. Please try again.");
    } finally {
      isPublishing = false;
    }
  }

  async function saveAsDraft() {
    isSavingDraft = true;

    try {
      console.log("Step5 - Saving draft data:", eventData);

      // Prepare the event data for the database
      const eventDataForDB = {
        ...eventData,
        status: "draft", // Set status to draft
        created_at: new Date().toISOString(),
      };

      console.log("Step5 - Draft data for DB:", eventDataForDB);

      // Send to API
      const response = await fetch("/createEventApi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventDataForDB),
      });

      const result = await response.json();
      console.log("Step5 - API response:", result);

             if (result.success) {
         // Clear localStorage
         localStorage.removeItem("eventCreationData");
         draftSuccess = true;

         // Redirect to events page after a short delay
         setTimeout(() => {
           goto("/dashboard/events");
         }, 2000);
       } else {
        console.error("Error saving draft:", result.error);
        alert("Error saving draft: " + result.error);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Error saving draft. Please try again.");
    } finally {
      isSavingDraft = false;
    }
  }

  function prevStep() {
    // Save current data before going back
    console.log("Step5 - Saving data on prevStep:", eventData);
    localStorage.setItem("eventCreationData", JSON.stringify(eventData));
    goto("/dashboard/events/createEvent/step4");
  }

  function editStep(step: number) {
    goto(`/dashboard/events/createEvent/step${step}`);
  }
</script>

<div class="max-w-6xl mx-auto p-6" in:fade={{ duration: 300 }}>
  <!-- Title -->
  <div class="text-center mb-8">
    <h1 class="text-3xl font-bold text-white mb-2">Create New Event</h1>
  </div>

  <!-- Stepper Progress -->
  <StepperProgress currentStep={5} />

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
  {:else if draftSuccess}
    <div
      class="bg-blue-800 border border-blue-600 rounded-lg p-6 text-center"
    >
      <svg
        class="w-16 h-16 text-blue-400 mx-auto mb-4"
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
        Draft Saved Successfully!
      </h3>
      <p class="text-blue-200">
        Your event draft has been saved. You can edit and publish it later from the events page.
      </p>
      <div class="mt-4">
        <button
          on:click={() => goto("/dashboard/events")}
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Go to Events
        </button>
      </div>
    </div>
  {:else}
    <!-- Review Content -->
    <div class="space-y-8">
      <!-- Step 1: Basic Information -->
      <div class="bg-gray-800 rounded-xl p-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white">Basic Information</h2>
          <button
            on:click={() => editStep(1)}
            class="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 text-sm"
          >
            Edit Step 1
          </button>
        </div>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Event Name:</span>
            <span class="text-white font-medium"
              >{eventData.name || "Not set"}</span
            >
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Date & Time:</span>
            <span class="text-white font-medium">
              {eventData.date ? formatDate(eventData.date) : "Not set"}, {eventData.time
                ? formatTime(eventData.time)
                : "Not set"}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Venue:</span>
            <span class="text-white font-medium"
              >{eventData.location || "Not set"}</span
            >
          </div>
          <div class="flex justify-between items-start">
            <span class="text-gray-400">Description:</span>
            <span class="text-white font-medium max-w-md text-right">
              {eventData.description || "Not set"}
            </span>
          </div>
        </div>
      </div>

      <!-- Step 2: Event Details -->
      <div class="bg-gray-800 rounded-xl p-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white">Event Details</h2>
          <button
            on:click={() => editStep(2)}
            class="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 text-sm"
          >
            Edit Step 2
          </button>
        </div>
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span class="text-gray-400 text-sm">Category:</span>
              <p class="text-white font-medium">
                {eventData.category || "Not set"}
              </p>
            </div>
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
            <div>
              <span class="text-gray-400 text-sm">Website:</span>
              <p class="text-white font-medium">
                {eventData.website || "Not set"}
              </p>
            </div>
          </div>

          {#if eventData.tags && eventData.tags.length > 0}
            <div>
              <span class="text-gray-400 text-sm">Tags:</span>
              <div class="flex flex-wrap gap-2 mt-1">
                {#each eventData.tags as tag}
                  <span
                    class="px-3 py-1 bg-teal-500 text-white text-sm rounded-full"
                    >{tag}</span
                  >
                {/each}
              </div>
            </div>
          {/if}

          <div>
            <span class="text-gray-400 text-sm">Event Image:</span>
            <div class="mt-2">
              {#if eventData.imagePreview}
                <img
                  src={eventData.imagePreview}
                  alt="Event preview"
                  class="w-32 h-32 object-cover rounded-lg border border-gray-600"
                />
              {:else if eventData.image}
                <div
                  class="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-8 h-8 text-gray-500"
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
                <span class="text-gray-500 text-sm">No image uploaded</span>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Ticket Types & Seating -->
      <div class="bg-gray-800 rounded-xl p-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white">Ticket Types & Seating</h2>
          <button
            on:click={() => editStep(3)}
            class="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 text-sm"
          >
            Edit Step 3
          </button>
        </div>

        <!-- Ticket Types Section -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-white">Ticket Types</h3>
            {#if eventData.is_free_event}
              <span
                class="px-3 py-1 bg-green-500 text-white text-sm rounded-full"
              >
                Free Event
              </span>
            {/if}
          </div>
          <div class="space-y-4">
            {#if eventData.ticket_types && eventData.ticket_types.length > 0}
              {#each eventData.ticket_types as ticket}
                <div class="p-4 bg-gray-700 rounded-lg">
                  <div class="flex justify-between items-start">
                    <div>
                      <h4 class="font-medium text-white">{ticket.name}</h4>
                      <p class="text-gray-400 text-sm">{ticket.description}</p>
                      {#if ticket.benefits && ticket.benefits.length > 0}
                        <div class="mt-2">
                          <span class="text-gray-400 text-xs">Benefits:</span>
                          <ul class="text-gray-300 text-xs mt-1">
                            {#each ticket.benefits as benefit}
                              <li>• {benefit}</li>
                            {/each}
                          </ul>
                        </div>
                      {/if}
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
            {:else}
              <p class="text-gray-400">No ticket types configured</p>
            {/if}
          </div>
        </div>

        <!-- Seating & Capacity Section -->
        <div class="border-t border-gray-700 pt-6">
          <h3 class="text-lg font-semibold text-white mb-4">
            Seating & Capacity
          </h3>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="text-gray-400 text-sm">Seating Type:</span>
                <p class="text-white font-medium capitalize">
                  {eventData.seating_type?.replace("-", " ") || "Not set"}
                </p>
              </div>
              <div>
                <span class="text-gray-400 text-sm">Total Capacity:</span>
                <p class="text-white font-medium">
                  {eventData.total_capacity || "Not set"}
                </p>
              </div>
            </div>

            {#if eventData.seating_options}
              <div class="border-t border-gray-700 pt-4">
                <h4 class="text-white font-medium mb-2">Seating Options</h4>
                <div class="space-y-2">
                  <div class="flex items-center">
                    <span class="text-gray-400 text-sm"
                      >Max Seats Per Order:</span
                    >
                    <span class="text-white font-medium ml-2"
                      >{eventData.seating_options.max_seats_per_order}</span
                    >
                  </div>
                  <div class="flex items-center">
                    <span class="text-gray-400 text-sm"
                      >Allow Seat Selection:</span
                    >
                    <span class="text-white font-medium ml-2"
                      >{eventData.seating_options.allow_seat_selection
                        ? "Yes"
                        : "No"}</span
                    >
                  </div>
                  <div class="flex items-center">
                    <span class="text-gray-400 text-sm">Reserved Seating:</span>
                    <span class="text-white font-medium ml-2"
                      >{eventData.seating_options.reserved_seating
                        ? "Yes"
                        : "No"}</span
                    >
                  </div>
                </div>
              </div>
            {/if}

            {#if eventData.venue_sections && eventData.venue_sections.length > 0}
              <div class="border-t border-gray-700 pt-4">
                <h4 class="text-white font-medium mb-3">Venue Sections</h4>
                <div class="space-y-2">
                  {#each eventData.venue_sections as section}
                    <div class="p-3 bg-gray-700 rounded-lg">
                      <div class="flex justify-between items-center">
                        <div>
                          <h5 class="font-medium text-white">{section.name}</h5>
                          <p class="text-gray-400 text-sm">
                            {section.description}
                          </p>
                        </div>
                        <div class="text-right">
                          <p class="text-white font-medium">
                            {formatPrice(section.price)}
                          </p>
                          <p class="text-gray-400 text-sm">
                            Capacity: {section.capacity}
                          </p>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Step 4: Event Settings -->
      <div class="bg-gray-800 rounded-xl p-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white">Event Settings</h2>
          <button
            on:click={() => editStep(4)}
            class="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 text-sm"
          >
            Edit Step 4
          </button>
        </div>
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span class="text-gray-400 text-sm">Audience Type:</span>
              <p class="text-white font-medium capitalize">
                {eventData.audience_type?.replace("-", " ") || "Not set"}
              </p>
            </div>
            <div>
              <span class="text-gray-400 text-sm">Event Visibility:</span>
              <p class="text-white font-medium capitalize">
                {eventData.event_visibility?.replace("-", " ") || "Not set"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 3D Ticket Mockup Preview -->
      <div class="bg-gray-700 rounded-xl p-6">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <img
              src={eventData.image
                ? "/src/lib/assets/explosion.png"
                : "/src/lib/assets/explosion.png"}
              alt="Event Preview"
              class="w-full h-48 object-cover rounded-lg"
            />
          </div>
          <div class="flex-1 ml-6 text-center">
            <h3 class="text-lg font-semibold text-white mb-2">
              3D Ticket Mockup
            </h3>
            <p class="text-gray-400">Preview</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-between items-center mt-8">
      <button
        on:click={prevStep}
        class="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
      >
        Previous: Event Settings
      </button>

      <button
        on:click={saveAsDraft}
        disabled={isSavingDraft}
        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        {#if isSavingDraft}
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
            Saving Draft...
          </div>
        {:else}
          Save as Draft
        {/if}
      </button>

      <button
        on:click={publishEvent}
        disabled={isPublishing}
        class="px-8 py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg hover:from-teal-500 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
</div>
