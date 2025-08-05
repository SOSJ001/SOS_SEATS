<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade, scale } from "svelte/transition";

  export let show = false;
  export let guest: any = null;

  const dispatch = createEventDispatcher();

  function closeModal() {
    show = false;
    dispatch("close");
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "checked-in":
        return "text-green-400";
      case "confirmed":
        return "text-blue-400";
      case "pending":
        return "text-yellow-400";
      case "cancelled":
        return "text-red-400";
      default:
        return "text-gray-300";
    }
  }

  function formatWalletAddress(walletAddress: string): string {
    if (!walletAddress) return "No wallet";
    if (walletAddress.length <= 8) return walletAddress;
    return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case "checked-in":
        return "bg-green-500";
      case "confirmed":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  }

  function formatPrice(price: number | string): string {
    if (!price || price === 0 || price === "0") return "Free";
    return `$${price}`;
  }

  function formatDate(dateString: string): string {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  function formatDateTime(dateString: string): string {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("en-US", options);
  }

  function formatOrderDate(dateString: string): string {
    if (!dateString) return "N/A";
    return new Date(dateString).toISOString().split("T")[0];
  }
</script>

{#if show && guest}
  <!-- Backdrop -->
  <button
    type="button"
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === "Escape" && closeModal()}
    aria-label="Close modal"
    transition:fade={{ duration: 200 }}
  >
    <!-- Modal Content -->
    <div
      class="relative w-full max-w-2xl h-[90vh] sm:h-[85vh] flex flex-col mx-1 sm:mx-2 md:mx-4"
      transition:scale={{ duration: 200, start: 0.95 }}
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
      <div class="relative z-10 flex flex-col h-full">
        <!-- Header - Fixed at top -->
        <div class="flex-shrink-0 p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4">
          <!-- Header with title and status badge -->
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6"
          >
            <h2
              class="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight break-words"
            >
              {guest.event_title || guest.event_name || "Event"}
            </h2>
            <div
              class="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold uppercase text-white self-start sm:self-auto {getStatusBadgeColor(
                guest.status
              )}"
            >
              {guest.status === "checked-in"
                ? "Checked In"
                : guest.status === "confirmed"
                  ? "Confirmed"
                  : guest.status === "pending"
                    ? "Pending"
                    : guest.status === "cancelled"
                      ? "Cancelled"
                      : guest.status}
            </div>
          </div>

          <!-- Horizontal line separator -->
          <div class="border-b border-gray-700"></div>
        </div>

        <!-- Scrollable content area -->
        <div
          class="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6"
        >
          <!-- Guest Information Section -->
          <div class="mb-4 sm:mb-6">
            <h3
              class="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg"
            >
              Guest Information
            </h3>

            <!-- Date & Time -->
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3 sm:mb-4"
            >
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span
                  class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                  >Date & Time</span
                >
              </div>
              <span
                class="text-white text-sm sm:text-base ml-6 sm:ml-0 text-right break-words"
              >
                {formatDateTime(guest.event_date)}
              </span>
            </div>

            <!-- Ticket Type -->
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3 sm:mb-4"
            >
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
                <span
                  class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                  >Ticket Type</span
                >
              </div>
              <span
                class="text-white text-sm sm:text-base ml-6 sm:ml-0 text-right break-words"
              >
                {guest.ticket_type_name ||
                  guest.ticket_type ||
                  "General Admission"}
              </span>
            </div>

            <!-- Guest Name -->
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3 sm:mb-4"
            >
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span
                  class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                  >Guest Name</span
                >
              </div>
              <span
                class="text-white font-semibold text-sm sm:text-base ml-6 sm:ml-0 text-right break-words"
              >
                {guest.name ||
                  `${guest.first_name || ""} ${guest.last_name || ""}`.trim() ||
                  "N/A"}
              </span>
            </div>

            <!-- Email -->
            {#if guest.email}
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3 sm:mb-4"
              >
                <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                  <svg
                    class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span
                    class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                    >Email</span
                  >
                </div>
                <span
                  class="text-white text-sm sm:text-base ml-6 sm:ml-0 text-right break-all"
                >
                  {guest.email}
                </span>
              </div>
            {/if}

            <!-- Phone -->
            {#if guest.phone}
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3 sm:mb-4"
              >
                <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                  <svg
                    class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span
                    class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                    >Phone</span
                  >
                </div>
                <span
                  class="text-white text-sm sm:text-base ml-6 sm:ml-0 text-right break-all"
                >
                  {guest.phone}
                </span>
              </div>
            {/if}

            <!-- Price -->
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0"
            >
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                <span
                  class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                  >Price</span
                >
              </div>
              <span
                class="text-white font-semibold text-sm sm:text-base ml-6 sm:ml-0 text-right"
              >
                {formatPrice(guest.ticket_type_price || guest.ticket_price)}
              </span>
            </div>

            <!-- Special Requirements -->
            {#if guest.special_requirements}
              <div class="mt-3 sm:mt-4">
                <div class="flex items-start gap-2 sm:gap-3">
                  <svg
                    class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div class="flex-1 min-w-0">
                    <span class="text-gray-400 text-sm sm:text-base block mb-1"
                      >Special Requirements</span
                    >
                    <span class="text-white text-sm sm:text-base break-words"
                      >{guest.special_requirements}</span
                    >
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <!-- Horizontal line separator -->
          <div class="border-b border-gray-700 mb-4 sm:mb-6"></div>

          <!-- Ticket Details Section -->
          <div class="mb-4 sm:mb-6">
            <h3
              class="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg"
            >
              Ticket Details
            </h3>

            <!-- Ticket Number -->
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3 sm:mb-4"
            >
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
                <span
                  class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                  >Ticket #</span
                >
              </div>
              <span
                class="text-white font-mono text-sm sm:text-base ml-6 sm:ml-0 text-right break-all"
              >
                {guest.ticket_number ||
                  guest.order_item_id?.slice(0, 8) ||
                  "N/A"}
              </span>
            </div>

            <!-- Current Owner -->
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3 sm:mb-4"
            >
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span
                  class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                  >Current Owner</span
                >
              </div>
              <span
                class="text-green-400 font-mono text-sm sm:text-base ml-6 sm:ml-0 text-right break-all"
                title={guest.current_owner ||
                  guest.wallet_address_full ||
                  guest.wallet_address}
              >
                {formatWalletAddress(
                  guest.current_owner ||
                    guest.wallet_address_full ||
                    guest.wallet_address
                )}
              </span>
            </div>

            <!-- Venue Section -->
            {#if guest.venue_section_name || guest.venue_section}
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3 sm:mb-4"
              >
                <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                  <svg
                    class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span
                    class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                    >Venue Section</span
                  >
                </div>
                <span
                  class="text-white text-sm sm:text-base ml-6 sm:ml-0 text-right break-words"
                >
                  {guest.venue_section_name || guest.venue_section || "General"}
                </span>
              </div>
            {/if}

            <!-- Seat Number -->
            {#if guest.seat_number}
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0"
              >
                <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                  <svg
                    class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  <span
                    class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                    >Seat Number</span
                  >
                </div>
                <span
                  class="text-white font-mono text-sm sm:text-base ml-6 sm:ml-0 text-right"
                >
                  {guest.seat_number}
                </span>
              </div>
            {/if}
          </div>

          <!-- Horizontal line separator -->
          <div class="border-b border-gray-700 mb-4 sm:mb-6"></div>

          <!-- Order Information Section -->
          <div class="mb-4 sm:mb-6">
            <h3
              class="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg"
            >
              Order Information
            </h3>

            <!-- Order Number -->
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3 sm:mb-4"
            >
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
                <span
                  class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                  >Order Number</span
                >
              </div>
              <span
                class="text-white font-mono text-sm sm:text-base ml-6 sm:ml-0 text-right break-all"
              >
                {guest.order_number || `GUEST-${guest.id?.slice(0, 8)}`}
              </span>
            </div>

            <!-- Order Date -->
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3 sm:mb-4"
            >
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span
                  class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                  >Order Date</span
                >
              </div>
              <span
                class="text-white text-sm sm:text-base ml-6 sm:ml-0 text-right"
              >
                {formatOrderDate(guest.created_at)}
              </span>
            </div>

            <!-- Payment Status -->
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3 sm:mb-4"
            >
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <span
                  class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                  >Payment Status</span
                >
              </div>
              <span
                class="text-green-400 font-semibold text-sm sm:text-base ml-6 sm:ml-0 text-right"
              >
                {guest.payment_status || "Completed"}
              </span>
            </div>

            <!-- Payment Method -->
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3 sm:mb-4"
            >
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <span
                  class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                  >Payment Method</span
                >
              </div>
              <span
                class="text-green-400 font-semibold text-sm sm:text-base ml-6 sm:ml-0 text-right"
              >
                {guest.payment_method ||
                  (guest.ticket_type_price || guest.ticket_price
                    ? "Credit Card"
                    : "Free Ticket")}
              </span>
            </div>

            <!-- Total Amount -->
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0"
            >
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                <span
                  class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                  >Total Amount</span
                >
              </div>
              <span
                class="text-white font-semibold text-sm sm:text-base ml-6 sm:ml-0 text-right"
              >
                {formatPrice(guest.ticket_type_price || guest.ticket_price)}
              </span>
            </div>
          </div>

          <!-- Additional Information (if available) -->
          {#if guest.check_in_time}
            <div class="border-t border-gray-700 pt-4 sm:pt-6">
              <h3
                class="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg"
              >
                Check-in Information
              </h3>

              <!-- Check-in Time -->
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0"
              >
                <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                  <svg
                    class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span
                    class="text-gray-400 text-sm sm:text-base whitespace-nowrap"
                    >Check-in Time</span
                  >
                </div>
                <span
                  class="text-white text-sm sm:text-base ml-6 sm:ml-0 text-right break-words"
                >
                  {formatDateTime(guest.check_in_time)}
                </span>
              </div>
            </div>
          {/if}
        </div>

        <!-- Action Buttons - Fixed at bottom -->
        <div
          class="flex-shrink-0 p-3 sm:p-4 md:p-6 pt-2 sm:pt-3 md:pt-4 border-t border-gray-700"
        >
          <div class="flex justify-center">
            <button
              on:click={closeModal}
              class="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all duration-300 text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </button>
{/if}
