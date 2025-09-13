<script lang="ts">
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import StepperProgress from "$lib/components/StepperProgress.svelte";
  import TicketDesignEditor from "$lib/components/TicketDesignEditor.svelte";
  import {
    showToast,
    generateTicketPreview,
    defaultTicketDesignConfig,
    type TicketDesignConfig,
  } from "$lib/store";

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

    // Step 5 data (Ticket Design)
    ticket_design_config?: TicketDesignConfig;
  }

  let eventData: EventData = {};
  let isPublishing = false;
  let isSavingDraft = false;
  let publishSuccess = false;
  let draftSuccess = false;

  // Ticket preview state
  let ticketPreviewUrl: string | null = null;
  let generatingPreview = false;
  let selectedTicketTypeForPreview: any = null;

  // Ticket design config
  let ticketDesignConfig: TicketDesignConfig = defaultTicketDesignConfig;

  onMount(() => {
    // Load all data from previous steps
    const savedData = localStorage.getItem("eventCreationData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      eventData = parsed;

      // Load ticket design config if available, otherwise use default
      if (eventData.ticket_design_config) {
        ticketDesignConfig = eventData.ticket_design_config;

        // Ensure textBox.enabled exists for backward compatibility
        if (
          ticketDesignConfig.textBox &&
          ticketDesignConfig.textBox.enabled === undefined
        ) {
          ticketDesignConfig.textBox.enabled = true;
        }
      } else {
        // Initialize with default config if none exists
        ticketDesignConfig = defaultTicketDesignConfig;
        eventData.ticket_design_config = defaultTicketDesignConfig;
        // Save the default config to localStorage
        localStorage.setItem("eventCreationData", JSON.stringify(eventData));
      }

      // Set default ticket type for preview
      if (eventData.ticket_types && eventData.ticket_types.length > 0) {
        selectedTicketTypeForPreview = eventData.ticket_types[0];
        generateTicketPreviewForEvent();
      }
    } else {
      // No saved data - initialize with default design config
      ticketDesignConfig = defaultTicketDesignConfig;
      eventData.ticket_design_config = defaultTicketDesignConfig;
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

  // Helper function to convert File to base64
  function convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Helper function to get image dimensions and calculate canvas size
  async function getImageDimensions(
    imageSrc: string | File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;

      if (typeof imageSrc === "string") {
        img.src = imageSrc;
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          img.src = reader.result as string;
        };
        reader.readAsDataURL(imageSrc);
      }
    });
  }

  // Helper function to calculate optimal canvas size based on image dimensions
  function calculateCanvasSize(
    imageWidth: number,
    imageHeight: number
  ): { width: number; height: number } {
    // Define minimum and maximum canvas dimensions
    const minWidth = 300;
    const maxWidth = 800;
    const minHeight = 400;
    const maxHeight = 1200;

    // Calculate aspect ratio
    const aspectRatio = imageWidth / imageHeight;

    // Start with the image dimensions
    let canvasWidth = imageWidth;
    let canvasHeight = imageHeight;

    // Adjust width if it's outside our bounds
    if (canvasWidth < minWidth) {
      canvasWidth = minWidth;
      canvasHeight = canvasWidth / aspectRatio;
    } else if (canvasWidth > maxWidth) {
      canvasWidth = maxWidth;
      canvasHeight = canvasWidth / aspectRatio;
    }

    // Adjust height if it's outside our bounds
    if (canvasHeight < minHeight) {
      canvasHeight = minHeight;
      canvasWidth = canvasHeight * aspectRatio;
    } else if (canvasHeight > maxHeight) {
      canvasHeight = maxHeight;
      canvasWidth = canvasHeight * aspectRatio;
    }

    // Round to nearest 10 for clean numbers
    return {
      width: Math.round(canvasWidth / 10) * 10,
      height: Math.round(canvasHeight / 10) * 10,
    };
  }

  async function publishEvent() {
    isPublishing = true;

    try {
      // Convert image to base64 if it exists
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
        ticket_design_config: ticketDesignConfig, // Include ticket design config
        status: "published", // Set status to published, not draft
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      // Send to API
      const response = await fetch("/createEventApi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventDataForDB),
      });

      const result = await response.json();
      if (result.success) {
        // Clear localStorage
        localStorage.removeItem("eventCreationData");
        publishSuccess = true;

        // Redirect to events page after a short delay
        setTimeout(() => {
          goto("/dashboard/events");
        }, 2000);
      } else {
        showToast("error", "Publishing Failed", result.error);
      }
    } catch (error) {
      showToast(
        "error",
        "Publishing Failed",
        "Error publishing event. Please try again."
      );
    } finally {
      isPublishing = false;
    }
  }

  async function saveAsDraft() {
    isSavingDraft = true;

    try {
      // Convert image to base64 if it exists
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
        ticket_design_config: ticketDesignConfig, // Include ticket design config
        status: "draft", // Set status to draft
        created_at: new Date().toISOString(),
      };

      // Send to API
      const response = await fetch("/createEventApi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventDataForDB),
      });

      const result = await response.json();
      if (result.success) {
        // Clear localStorage
        localStorage.removeItem("eventCreationData");
        draftSuccess = true;

        // Redirect to events page after a short delay
        setTimeout(() => {
          goto("/dashboard/events");
        }, 2000);
      } else {
        showToast("error", "Save Failed", result.error);
      }
    } catch (error) {
      showToast(
        "error",
        "Save Failed",
        "Error saving draft. Please try again."
      );
    } finally {
      isSavingDraft = false;
    }
  }

  function prevStep() {
    // Save current data before going back
    localStorage.setItem("eventCreationData", JSON.stringify(eventData));
    goto("/dashboard/events/createEvent/step4");
  }

  function editStep(step: number) {
    goto(`/dashboard/events/createEvent/step${step}`);
  }

  async function generateTicketPreviewForEvent() {
    if (generatingPreview || !eventData.name || !selectedTicketTypeForPreview)
      return;

    generatingPreview = true;
    try {
      // Get event image
      let eventImage: string | File | undefined = undefined;
      if (eventData.imagePreview) {
        eventImage = eventData.imagePreview;
      } else if (eventData.image && eventData.image instanceof File) {
        eventImage = eventData.image;
      }

      // Calculate dynamic canvas size based on event image
      let dynamicDesignConfig = { ...ticketDesignConfig };

      if (eventImage) {
        try {
          const imageDimensions = await getImageDimensions(eventImage);
          const canvasSize = calculateCanvasSize(
            imageDimensions.width,
            imageDimensions.height
          );

          // Update the design config with dynamic canvas size
          dynamicDesignConfig = {
            ...ticketDesignConfig,
            canvas: {
              width: canvasSize.width,
              height: canvasSize.height,
            },
          };

          console.log(
            `Dynamic canvas size: ${canvasSize.width}x${canvasSize.height} (from image: ${imageDimensions.width}x${imageDimensions.height})`
          );
        } catch (imageError) {
          console.warn(
            "Could not get image dimensions, using default canvas size:",
            imageError
          );
        }
      }

      // Generate ticket preview using the reusable function
      const previewUrl = await generateTicketPreview({
        eventName: eventData.name,
        eventDate: eventData.date,
        eventTime: eventData.time,
        eventLocation: eventData.location,
        eventImage: eventImage,
        ticketTypeName: selectedTicketTypeForPreview.name,
        ticketPrice: selectedTicketTypeForPreview.price,
        organizer: eventData.organizer,
        ticketNumber: "TIX-XXXXXXXX",
        designConfig: dynamicDesignConfig,
      });

      ticketPreviewUrl = previewUrl;
    } catch (err) {
      console.error("Error generating ticket preview:", err);
    } finally {
      generatingPreview = false;
    }
  }

  function handleDesignConfigChange(newConfig: TicketDesignConfig) {
    ticketDesignConfig = newConfig;
    eventData.ticket_design_config = newConfig;

    // Save to localStorage
    localStorage.setItem("eventCreationData", JSON.stringify(eventData));

    // Regenerate preview with new config (will recalculate canvas size)
    generateTicketPreviewForEvent();
  }

  function selectTicketTypeForPreview(ticketType: any) {
    selectedTicketTypeForPreview = ticketType;
    generateTicketPreviewForEvent();
  }
</script>

<div class="max-w-4xl mx-auto p-3 sm:p-6" in:fade={{ duration: 300 }}>
  <!-- Title -->
  <div class="text-center mb-4 sm:mb-8">
    <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
      Create New Event
    </h1>
  </div>

  <!-- Stepper Progress -->
  <StepperProgress currentStep={5} />

  {#if publishSuccess}
    <div
      class="bg-green-800 border border-green-600 rounded-lg p-4 sm:p-6 text-center"
    >
      <svg
        class="w-12 h-12 sm:w-16 sm:h-16 text-green-400 mx-auto mb-3 sm:mb-4"
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
      <h3 class="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
        Event Published Successfully!
      </h3>
      <p class="text-green-200 text-xs sm:text-sm md:text-base">
        Your event is now live and ready for ticket sales.
      </p>
    </div>
  {:else if draftSuccess}
    <div
      class="bg-blue-800 border border-blue-600 rounded-lg p-4 sm:p-6 text-center"
    >
      <svg
        class="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mx-auto mb-3 sm:mb-4"
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
      <h3 class="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
        Draft Saved Successfully!
      </h3>
      <p class="text-blue-200 text-xs sm:text-sm md:text-base">
        Your event draft has been saved. You can edit and publish it later from
        the events page.
      </p>
      <div class="mt-3 sm:mt-4">
        <button
          on:click={() => goto("/dashboard/events")}
          class="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-xs sm:text-sm md:text-base"
        >
          Go to Events
        </button>
      </div>
    </div>
  {:else}
    <!-- Review Content -->
    <div class="space-y-4 sm:space-y-6 md:space-y-8">
      <!-- Step 1: Basic Information -->
      <div class="bg-gray-800 rounded-xl p-3 sm:p-6 md:p-8">
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6"
        >
          <h2 class="text-base sm:text-lg md:text-xl font-bold text-white">
            Basic Information
          </h2>
          <button
            on:click={() => editStep(1)}
            class="w-full sm:w-auto px-3 sm:px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 text-xs sm:text-sm"
          >
            Edit Step 1
          </button>
        </div>
        <div class="space-y-2 sm:space-y-3">
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2"
          >
            <span class="text-gray-400 text-xs sm:text-sm md:text-base"
              >Event Name:</span
            >
            <span
              class="text-white font-medium text-xs sm:text-sm md:text-base text-right break-words"
              >{eventData.name || "Not set"}</span
            >
          </div>
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2"
          >
            <span class="text-gray-400 text-xs sm:text-sm md:text-base"
              >Date & Time:</span
            >
            <span
              class="text-white font-medium text-xs sm:text-sm md:text-base text-right"
            >
              {eventData.date ? formatDate(eventData.date) : "Not set"}, {eventData.time
                ? formatTime(eventData.time)
                : "Not set"}
            </span>
          </div>
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2"
          >
            <span class="text-gray-400 text-xs sm:text-sm md:text-base"
              >Venue:</span
            >
            <span
              class="text-white font-medium text-xs sm:text-sm md:text-base text-right break-words"
              >{eventData.location || "Not set"}</span
            >
          </div>
          <div
            class="flex flex-col sm:flex-row justify-between items-start gap-1 sm:gap-2"
          >
            <span class="text-gray-400 text-xs sm:text-sm md:text-base"
              >Description:</span
            >
            <span
              class="text-white font-medium text-xs sm:text-sm md:text-base text-right max-w-xs sm:max-w-md break-words"
            >
              {eventData.description || "Not set"}
            </span>
          </div>
        </div>
      </div>

      <!-- Step 2: Event Details -->
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
              <span class="text-gray-400 text-xs sm:text-sm"
                >Contact Email:</span
              >
              <p
                class="text-white font-medium text-xs sm:text-sm md:text-base break-words"
              >
                {eventData.contact_email || "Not set"}
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
                        {formatPrice(ticket.price)}
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
                  {eventData.seating_type?.replace("-", " ") || "Not set"}
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

            {#if eventData.seating_options}
              <div class="border-t border-gray-700 pt-3 sm:pt-4">
                <h4 class="text-white font-medium mb-2 text-sm sm:text-base">
                  Seating Options
                </h4>
                <div class="space-y-1 sm:space-y-2">
                  <div
                    class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
                  >
                    <span class="text-gray-400 text-xs sm:text-sm"
                      >Max Seats Per Order:</span
                    >
                    <span
                      class="text-white font-medium text-xs sm:text-sm md:text-base"
                      >{eventData.seating_options.max_seats_per_order}</span
                    >
                  </div>
                  <div
                    class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
                  >
                    <span class="text-gray-400 text-xs sm:text-sm"
                      >Allow Seat Selection:</span
                    >
                    <span
                      class="text-white font-medium text-xs sm:text-sm md:text-base"
                      >{eventData.seating_options.allow_seat_selection
                        ? "Yes"
                        : "No"}</span
                    >
                  </div>
                  <div
                    class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
                  >
                    <span class="text-gray-400 text-xs sm:text-sm"
                      >Reserved Seating:</span
                    >
                    <span
                      class="text-white font-medium text-xs sm:text-sm md:text-base"
                      >{eventData.seating_options.reserved_seating
                        ? "Yes"
                        : "No"}</span
                    >
                  </div>
                </div>
              </div>
            {/if}

            {#if eventData.venue_sections && eventData.venue_sections.length > 0}
              <div class="border-t border-gray-700 pt-3 sm:pt-4">
                <h4
                  class="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base"
                >
                  Venue Sections
                </h4>
                <div class="space-y-2">
                  {#each eventData.venue_sections as section}
                    <div class="p-2 sm:p-3 bg-gray-700 rounded-lg">
                      <div
                        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                      >
                        <div class="flex-1 min-w-0">
                          <h5
                            class="font-medium text-white text-xs sm:text-sm md:text-base break-words"
                          >
                            {section.name}
                          </h5>
                          <p
                            class="text-gray-400 text-xs sm:text-sm break-words"
                          >
                            {section.description}
                          </p>
                        </div>
                        <div class="text-right sm:text-left flex-shrink-0">
                          <p
                            class="text-white font-medium text-xs sm:text-sm md:text-base"
                          >
                            {formatPrice(section.price)}
                          </p>
                          <p class="text-gray-400 text-xs sm:text-sm">
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
      </div>

      <!-- Ticket Preview Section -->
      <div class="bg-gray-800 rounded-xl p-3 sm:p-6 md:p-8">
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6"
        >
          <h2 class="text-base sm:text-lg md:text-xl font-bold text-white">
            Ticket Preview
          </h2>
          <p class="text-gray-400 text-xs sm:text-sm">
            See how your tickets will look to attendees
          </p>
        </div>

        {#if eventData.ticket_types && eventData.ticket_types.length > 0}
          <!-- Ticket Type Selector -->
          <div class="mb-4 sm:mb-6">
            <h3
              class="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base"
            >
              Select Ticket Type to Preview:
            </h3>
            <div class="flex flex-wrap gap-1 sm:gap-2">
              {#each eventData.ticket_types as ticket}
                <button
                  on:click={() => selectTicketTypeForPreview(ticket)}
                  class="px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm {selectedTicketTypeForPreview?.name ===
                  ticket.name
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
                >
                  {ticket.name} - {formatPrice(ticket.price)}
                </button>
              {/each}
            </div>
          </div>

          <!-- Ticket Preview -->
          <div class="flex justify-center">
            <div
              class="border-2 border-dashed border-gray-600 rounded-lg p-3 sm:p-4 md:p-6 bg-gray-800/50 transition-all duration-500 max-w-xs sm:max-w-sm md:max-w-md w-full"
            >
              <h3
                class="text-xs sm:text-sm font-medium text-gray-300 mb-3 sm:mb-4 flex items-center gap-1 sm:gap-2 justify-center"
              >
                <svg
                  class="w-3 h-3 sm:w-4 sm:h-4 text-[#00F5FF]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Live Ticket Preview
              </h3>

              {#if generatingPreview}
                <div class="flex items-center justify-center py-6 sm:py-8">
                  <div class="text-center">
                    <div
                      class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#00F5FF] mx-auto mb-2"
                    ></div>
                    <p class="text-xs sm:text-sm text-gray-400">
                      Generating ticket preview...
                    </p>
                  </div>
                </div>
              {:else if ticketPreviewUrl}
                <div class="text-center">
                  <div
                    class="inline-block border-2 border-gray-600 rounded-lg overflow-hidden bg-white p-1 sm:p-2"
                  >
                    <img
                      src={ticketPreviewUrl}
                      alt="Ticket Preview"
                      class="max-w-full h-auto max-h-48 sm:max-h-64 md:max-h-80 object-contain"
                    />
                  </div>
                  <p class="text-xs text-gray-500 mt-2 sm:mt-3 italic">
                    This is how tickets will look when generated for your event
                  </p>
                </div>
              {:else}
                <div class="text-center py-6 sm:py-8">
                  <div
                    class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 bg-gray-700 rounded-lg flex items-center justify-center"
                  >
                    <svg
                      class="w-6 h-6 sm:w-8 sm:h-8 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p class="text-xs sm:text-sm text-gray-400">
                    Select a ticket type to see preview
                  </p>
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <div class="text-center py-8">
            <div
              class="w-16 h-16 mx-auto mb-3 bg-gray-700 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p class="text-gray-400">
              No ticket types configured. Add ticket types in Step 3 to see
              preview.
            </p>
          </div>
        {/if}
      </div>

      <!-- Ticket Design Editor -->
      <div class="bg-gray-800 rounded-xl p-3 sm:p-6 md:p-8">
        <div class="mb-4 sm:mb-6">
          <h2 class="text-base sm:text-lg md:text-xl font-bold text-white mb-2">
            Customize Ticket Design
          </h2>
          <p class="text-gray-400 text-xs sm:text-sm">
            Customize the appearance of your tickets including colors, fonts,
            positioning, and layout
          </p>
        </div>

        <TicketDesignEditor
          bind:designConfig={ticketDesignConfig}
          {eventData}
          onConfigChange={handleDesignConfigChange}
        />
      </div>
    </div>

    <!-- Action Buttons -->
    <div
      class="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-6 sm:mt-8"
    >
      <button
        on:click={prevStep}
        class="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-xs sm:text-sm md:text-base"
      >
        Previous: Event Settings
      </button>

      <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
        <button
          on:click={saveAsDraft}
          disabled={isSavingDraft}
          class="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-xs sm:text-sm md:text-base"
        >
          {#if isSavingDraft}
            <div class="flex items-center justify-center">
              <svg
                class="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
              <span class="text-xs sm:text-sm">Saving Draft...</span>
            </div>
          {:else}
            Save as Draft
          {/if}
        </button>

        <button
          on:click={publishEvent}
          disabled={isPublishing}
          class="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg hover:from-teal-500 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs sm:text-sm md:text-base"
        >
          {#if isPublishing}
            <div class="flex items-center justify-center">
              <svg
                class="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
              <span class="text-xs sm:text-sm">Publishing Event...</span>
            </div>
          {:else}
            Publish Event
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>
