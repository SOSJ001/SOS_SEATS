<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade, scale, fly } from "svelte/transition";
  import { addGuestToEvent, loadEventTicketTypes } from "$lib/supabase";
  import { generateTicketPreview } from "$lib/store";

  export let show = false;
  export let events: any[] = [];
  export let selectedEventId: string = "";

  const dispatch = createEventDispatcher();

  // Form data
  let formData = {
    guestName: "",
    ticketTypeId: "",
    status: "confirmed",
    eventId: selectedEventId,
  };

  // Ticket types for the selected event
  let ticketTypes: any[] = [];
  let loadingTicketTypes = false;

  // Loading state
  let loading = false;
  let error: string | null = null;

  // Ticket preview state
  let ticketPreviewUrl: string | null = null;
  let generatingPreview = false;

  // Reset form when modal opens
  $: if (show) {
    formData = {
      guestName: "",
      ticketTypeId: "",
      status: "confirmed",
      eventId: selectedEventId,
    };
    error = null;
  }

  // Load ticket types when event is selected (only for valid UUIDs)
  $: if (
    formData.eventId &&
    formData.eventId !== "" &&
    formData.eventId !== "all"
  ) {
    loadTicketTypesForEvent(formData.eventId);
  }

  // Generate ticket preview when form data changes
  $: if (
    formData.guestName &&
    formData.eventId &&
    formData.eventId !== "all" &&
    formData.eventId !== ""
  ) {
    generateTicketPreviewForGuest();
  }

  function closeModal() {
    show = false;
    dispatch("close");
  }

  async function loadTicketTypesForEvent(eventId: string) {
    loadingTicketTypes = true;
    try {
      const result = await loadEventTicketTypes(eventId);
      if (result.success && result.data) {
        ticketTypes = result.data;
        // Set default ticket type if available
        if (ticketTypes.length > 0 && !formData.ticketTypeId) {
          formData.ticketTypeId = ticketTypes[0].id;
        }
      } else {
        ticketTypes = [];
        error = result.error || "Failed to load ticket types";
      }
    } catch (err) {
      ticketTypes = [];
      error = "Failed to load ticket types";
    } finally {
      loadingTicketTypes = false;
    }
  }

  async function generateTicketPreviewForGuest() {
    if (generatingPreview) return;

    generatingPreview = true;
    try {
      const selectedEvent = events.find((e) => e.id === formData.eventId);
      if (!selectedEvent) return;

      // Get selected ticket type
      const selectedTicketType = ticketTypes.find(
        (t) => t.id === formData.ticketTypeId
      );

      if (!selectedTicketType) return;

      // Get event image as data URL
      let eventImage = null;
      if (selectedEvent.image) {
        try {
          const response = await fetch("/dataUrlApi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseImageSrc: selectedEvent.image }),
          });
          const result = await response.json();
          if (result.dataURL) {
            eventImage = result.dataURL;
          }
        } catch (err) {
          console.warn("Failed to fetch event image:", err);
        }
      }

      // Generate QR code data (using guest name + event ID as unique identifier)
      const qrData = `${formData.guestName}-${formData.eventId}-${Date.now()}`;

      // Generate ticket preview using the reusable function
      const previewUrl = await generateTicketPreview({
        eventName: selectedEvent.name,
        eventDate: selectedEvent.date,
        eventTime: selectedEvent.time,
        eventLocation: selectedEvent.location,
        eventImage: eventImage,
        ticketTypeName: selectedTicketType.name,
        ticketPrice: selectedTicketType.price,
        guestName: formData.guestName,
        organizer: selectedEvent.organizer,
        ticketNumber: "Will be generated",
        qrData: qrData,
        designConfig: selectedEvent.ticket_design_config,
      });

      ticketPreviewUrl = previewUrl;
    } catch (err) {
      console.error("Error generating ticket preview:", err);
    } finally {
      generatingPreview = false;
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    // Only close if clicking the backdrop itself, not the modal content
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  async function handleSubmit() {
    if (!formData.guestName) {
      error = "Guest name is required";
      return;
    }

    if (!formData.eventId || formData.eventId === "all") {
      error = "Please select a specific event";
      return;
    }

    loading = true;
    error = null;

    try {
      const guestData = {
        first_name: formData.guestName,
        last_name: "", // Empty since we're using single name field
        email: null, // No email collection
        phone: null, // No phone collection
        status: formData.status,
        special_requirements: null,
        ticket_type_id: formData.ticketTypeId || null,
        venue_section_id: null,
      };

      const result = await addGuestToEvent(formData.eventId, guestData);

      if (result.success) {
        dispatch("guestAdded", { guest: result.data });
        closeModal();
      } else {
        error = result.error || "Failed to add guest";
      }
    } catch (err) {
      error = "An unexpected error occurred";
      console.error("Error adding guest:", err);
    } finally {
      loading = false;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "text-yellow-400";
      case "confirmed":
        return "text-blue-400";
      case "checked-in":
        return "text-green-400";
      default:
        return "text-gray-300";
    }
  }
</script>

{#if show}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === "Escape" && closeModal()}
    role="button"
    tabindex="-1"
    aria-label="Close modal"
    transition:fade={{ duration: 200 }}
  >
    <!-- Modal Content -->
    <div
      class="relative w-full max-w-2xl h-[90vh] mx-1 sm:mx-2 md:mx-4"
      transition:scale={{ duration: 200, start: 0.95 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <!-- Background gradient matching project theme -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] rounded-xl border border-[#00F5FF]/20"
      ></div>

      <!-- Close button -->
      <button
        on:click={closeModal}
        class="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 w-8 h-8 bg-gray-800/50 hover:bg-gray-700/70 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 group"
      >
        <svg
          class="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- Main content with scrollable area -->
      <div class="relative z-10 flex flex-col h-full min-h-0">
        <!-- Header - Fixed at top -->
        <div class="flex-shrink-0 p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4">
          <div class="flex items-center gap-3 sm:gap-4">
            <!-- Event Image -->
            {#if formData.eventId && formData.eventId !== "all" && formData.eventId !== ""}
              {@const selectedEvent = events.find(
                (e) => e.id === formData.eventId
              )}
              {#if selectedEvent}
                <div
                  class="flex-shrink-0"
                  in:fly={{ x: -30, duration: 500, delay: 150 }}
                  out:fly={{ x: -30, duration: 200 }}
                >
                  {#if selectedEvent.image}
                    <div
                      class="relative overflow-hidden rounded-lg border border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-[#00F5FF]/50"
                      in:scale={{ duration: 400, delay: 200 }}
                      out:scale={{ duration: 200 }}
                    >
                      <img
                        src={selectedEvent.image}
                        alt={selectedEvent.name}
                        class="w-12 h-12 sm:w-14 sm:h-14 object-cover transition-all duration-500 hover:scale-110"
                        in:fade={{ duration: 600, delay: 300 }}
                        out:fade={{ duration: 200 }}
                      />
                      <!-- Subtle overlay for depth -->
                      <div
                        class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                      ></div>
                    </div>
                  {:else}
                    <div
                      class="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-[#9D4EDD] to-[#00F5FF] flex items-center justify-center border border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-[#00F5FF]/50 relative overflow-hidden"
                      in:scale={{ duration: 400, delay: 200 }}
                      out:scale={{ duration: 200 }}
                    >
                      <!-- Animated background gradient -->
                      <div
                        class="absolute inset-0 bg-gradient-to-br from-[#9D4EDD] via-[#00F5FF] to-[#9D4EDD] animate-pulse opacity-20"
                      ></div>
                      <svg
                        class="w-6 h-6 sm:w-7 sm:h-7 text-white transition-all duration-500 hover:rotate-12 hover:scale-110 relative z-10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        in:fly={{ y: 10, duration: 400, delay: 400 }}
                        out:fly={{ y: -10, duration: 200 }}
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  {/if}
                </div>
              {/if}
            {/if}

            <!-- Default animated background - always show when no specific event is selected -->
            {#if !formData.eventId || formData.eventId === "all" || formData.eventId === ""}
              <div
                class="flex-shrink-0"
                in:fly={{ x: -30, duration: 500, delay: 150 }}
                out:fly={{ x: -30, duration: 200 }}
              >
                <div
                  class="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-[#9D4EDD] to-[#00F5FF] flex items-center justify-center border border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-[#00F5FF]/50 relative overflow-hidden"
                  in:scale={{ duration: 400, delay: 200 }}
                  out:scale={{ duration: 200 }}
                >
                  <!-- Animated background gradient -->
                  <div
                    class="absolute inset-0 bg-gradient-to-br from-[#9D4EDD] via-[#00F5FF] to-[#9D4EDD] animate-pulse opacity-20"
                  ></div>
                  <svg
                    class="w-6 h-6 sm:w-7 sm:h-7 text-white transition-all duration-500 hover:rotate-12 hover:scale-110 relative z-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    in:fly={{ y: 10, duration: 400, delay: 400 }}
                    out:fly={{ y: -10, duration: 200 }}
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>
            {/if}

            <!-- Title and Event Info -->
            <div class="flex-1 min-w-0">
              <h2
                id="modal-title"
                class="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight break-words"
                in:fly={{ x: 20, duration: 500, delay: 100 }}
                out:fly={{ x: 20, duration: 200 }}
              >
                Generate Ticket
              </h2>
              {#if formData.eventId && formData.eventId !== "all"}
                {@const selectedEvent = events.find(
                  (e) => e.id === formData.eventId
                )}
                {#if selectedEvent}
                  <p
                    class="text-sm text-gray-400 mt-1 break-words transition-all duration-300 hover:text-[#00F5FF]"
                    in:fly={{ x: 20, duration: 500, delay: 250 }}
                    out:fly={{ x: 20, duration: 200 }}
                  >
                    for {selectedEvent.name}
                  </p>
                {/if}
              {/if}
            </div>
          </div>
          <!-- Horizontal line separator -->
          <div
            class="border-b border-gray-700 mt-4 transition-all duration-500 hover:border-[#00F5FF]/50"
            in:fly={{ y: 10, duration: 600, delay: 300 }}
            out:fly={{ y: -10, duration: 200 }}
          ></div>
        </div>

        <!-- Scrollable content area -->
        <div class="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6">
          <!-- Error Message -->
          {#if error}
            <div
              class="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
            >
              {error}
            </div>
          {/if}

          <!-- Form Fields -->
          <form
            id="guest-form"
            on:submit|preventDefault={handleSubmit}
            class="space-y-6"
          >
            <!-- Event Selection -->
            {#if events.length > 0}
              <div
                in:fly={{ y: 20, duration: 400, delay: 200 }}
                out:fly={{ y: -20, duration: 200 }}
              >
                <label
                  for="eventId"
                  class="block text-sm font-medium text-gray-300 mb-2"
                >
                  Event *
                </label>
                <select
                  id="eventId"
                  bind:value={formData.eventId}
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#00F5FF] focus:border-[#00F5FF] transition-all duration-300 hover:border-gray-500"
                  required
                >
                  <option value="">Select an event</option>
                  {#each events as event}
                    <option value={event.id}>{event.name}</option>
                  {/each}
                </select>
              </div>
            {/if}

            <!-- Guest Name Field -->
            <div
              in:fly={{ y: 20, duration: 400, delay: 300 }}
              out:fly={{ y: -20, duration: 200 }}
            >
              <label
                for="guestName"
                class="block text-sm font-medium text-gray-300 mb-2"
              >
                Guest Name *
              </label>
              <input
                id="guestName"
                type="text"
                bind:value={formData.guestName}
                placeholder="e.g., Alice Johnson or Guest #1"
                class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#00F5FF] focus:border-[#00F5FF] transition-all duration-300 hover:border-gray-500"
                required
              />
            </div>

            <!-- Ticket Type -->
            <div
              in:fly={{ y: 20, duration: 400, delay: 400 }}
              out:fly={{ y: -20, duration: 200 }}
            >
              <label
                for="ticketType"
                class="block text-sm font-medium text-gray-300 mb-2"
              >
                Ticket Type
              </label>
              {#if formData.eventId === "all"}
                <div
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-400 transition-all duration-300"
                >
                  Please select a specific event to choose ticket type
                </div>
              {:else if loadingTicketTypes}
                <div
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-400 transition-all duration-300"
                >
                  <span class="inline-block animate-pulse"
                    >Loading ticket types...</span
                  >
                </div>
              {:else if ticketTypes.length > 0}
                <select
                  id="ticketType"
                  bind:value={formData.ticketTypeId}
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#00F5FF] focus:border-[#00F5FF] transition-all duration-300 hover:border-gray-500"
                >
                  {#each ticketTypes as ticketType}
                    <option value={ticketType.id}>
                      {ticketType.name} - ${ticketType.price}
                    </option>
                  {/each}
                </select>
              {:else}
                <div
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-400 transition-all duration-300"
                >
                  No ticket types available for this event
                </div>
              {/if}
            </div>

            <!-- Guest Preview -->
            {#if formData.guestName}
              <div
                class="border-2 border-dashed border-gray-600 rounded-lg p-4 bg-gray-800/50 transition-all duration-500"
                in:scale={{ duration: 400, delay: 500 }}
                out:scale={{ duration: 200 }}
              >
                <h3
                  class="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2"
                >
                  <svg
                    class="w-4 h-4 text-[#00F5FF]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Ticket Details
                </h3>
                <div class="space-y-3 text-sm">
                  <!-- Guest Name -->
                  <div class="flex justify-between items-center">
                    <span class="text-gray-400">Guest Name:</span>
                    <span
                      class="font-medium text-white text-right max-w-[60%] break-words"
                      >{formData.guestName}</span
                    >
                  </div>

                  <!-- Event -->
                  {#if formData.eventId && formData.eventId !== "all"}
                    {@const selectedEvent = events.find(
                      (e) => e.id === formData.eventId
                    )}
                    {#if selectedEvent}
                      <div class="flex justify-between items-center">
                        <span class="text-gray-400">Event:</span>
                        <span
                          class="font-medium text-white text-right max-w-[60%] break-words"
                          >{selectedEvent.name}</span
                        >
                      </div>
                    {/if}
                  {/if}

                  <!-- Ticket Type -->
                  {#if formData.ticketTypeId}
                    {@const selectedTicketType = ticketTypes.find(
                      (tt) => tt.id === formData.ticketTypeId
                    )}
                    {#if selectedTicketType}
                      <div class="flex justify-between items-center">
                        <span class="text-gray-400">Ticket Type:</span>
                        <span class="font-medium text-white text-right"
                          >{selectedTicketType.name} - ${selectedTicketType.price}</span
                        >
                      </div>
                    {/if}
                  {/if}

                  <!-- Status -->
                  <div class="flex justify-between items-center">
                    <span class="text-gray-400">Status:</span>
                    <span
                      class="font-medium capitalize px-2 py-1 rounded-full text-xs bg-green-900/30 text-green-300 border border-green-700/50"
                      >{formData.status}</span
                    >
                  </div>

                  <!-- Ticket Number Preview -->
                  <div class="flex justify-between items-center">
                    <span class="text-gray-400">Ticket #:</span>
                    <span
                      class="font-mono text-white text-right text-xs bg-gray-700/50 px-2 py-1 rounded border"
                      >Will be generated</span
                    >
                  </div>
                </div>

                <!-- Preview Note -->
                <div class="mt-3 pt-3 border-t border-gray-700">
                  <p class="text-xs text-gray-500 italic">
                    A ticket will be generated and the guest will be added to
                    your event
                  </p>
                </div>
              </div>
            {/if}

            <!-- Ticket Preview -->
            {#if formData.guestName && formData.eventId && formData.eventId !== "all" && formData.eventId !== ""}
              <div
                class="border-2 border-dashed border-gray-600 rounded-lg p-4 bg-gray-800/50 transition-all duration-500"
                in:scale={{ duration: 400, delay: 600 }}
                out:scale={{ duration: 200 }}
              >
                <h3
                  class="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2"
                >
                  <svg
                    class="w-4 h-4 text-[#00F5FF]"
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
                  Ticket Preview
                </h3>

                {#if generatingPreview}
                  <div class="flex items-center justify-center py-8">
                    <div class="text-center">
                      <div
                        class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00F5FF] mx-auto mb-2"
                      ></div>
                      <p class="text-sm text-gray-400">
                        Generating ticket preview...
                      </p>
                    </div>
                  </div>
                {:else if ticketPreviewUrl}
                  <div class="text-center">
                    <div
                      class="inline-block border-2 border-gray-600 rounded-lg overflow-hidden bg-white p-2"
                    >
                      <img
                        src={ticketPreviewUrl}
                        alt="Ticket Preview"
                        class="max-w-full h-auto max-h-64 object-contain"
                        in:fade={{ duration: 500 }}
                        out:fade={{ duration: 200 }}
                      />
                    </div>
                    <p class="text-xs text-gray-500 mt-2 italic">
                      This is how the ticket will look when generated
                    </p>
                  </div>
                {:else}
                  <div class="text-center py-4">
                    <div
                      class="w-16 h-16 mx-auto mb-2 bg-gray-700 rounded-lg flex items-center justify-center"
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
                    <p class="text-sm text-gray-400">
                      Ticket preview will appear here
                    </p>
                  </div>
                {/if}
              </div>
            {/if}
          </form>
        </div>

        <!-- Action Buttons - Fixed at bottom -->
        <div
          class="flex-shrink-0 p-3 sm:p-4 md:p-6 pt-2 sm:pt-3 md:pt-4 border-t border-gray-700"
          in:fly={{ y: 20, duration: 400, delay: 600 }}
          out:fly={{ y: -20, duration: 200 }}
        >
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              on:click={closeModal}
              class="px-4 py-2 text-gray-300 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-300 hover:scale-105"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="guest-form"
              class="px-6 py-2 bg-gradient-to-r from-[#9D4EDD] to-[#00F5FF] text-white rounded-lg hover:from-[#9D4EDD]/90 hover:to-[#00F5FF]/90 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg"
              disabled={loading}
            >
              {#if loading}
                <svg
                  class="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Generating...</span>
              {:else}
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Generate Ticket</span>
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
