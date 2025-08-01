<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { getEventById } from "$lib/supabase.js";
  import EventHeroSection from "$lib/components/EventHeroSection.svelte";
  import EventDetailsCard from "$lib/components/EventDetailsCard.svelte";
  import TicketSelectionCard from "$lib/components/TicketSelectionCard.svelte";
  import PaymentSummaryCard from "$lib/components/PaymentSummaryCard.svelte";
  import DetailItem from "$lib/components/DetailItem.svelte";
  import GradientButton from "$lib/components/GradientButton.svelte";
  import QuantitySelector from "$lib/components/QuantitySelector.svelte";
  import BackButton from "$lib/components/BackButton.svelte";
  import ShareButton from "$lib/components/ShareButton.svelte";

  // Get event ID from URL params and load event data
  $: eventId = $page.params.eventId;
  let event: any = null;
  let loading = true;
  let error: string | null = null;

  // Ticket types with pricing
  let ticketTypes = [
    {
      id: 1,
      name: "Standard Ticket",
      price: 75,
      description: "General admission with access to all main areas",
      features: [
        "General admission",
        "Access to main stage",
        "Food & drink vendors",
      ],
      available_quantity: 100,
    },
    {
      id: 2,
      name: "VIP Pass",
      price: 150,
      description: "Premium experience with exclusive benefits",
      features: [
        "VIP seating area",
        "Exclusive lounge access",
        "Complimentary drinks",
        "Meet & greet opportunity",
      ],
      available_quantity: 50,
    },
  ];

  // State management
  let selectedTickets: Record<number, number> = {};
  let pageLoaded = false;

  // Initialize ticket quantities
  $: ticketTypes.forEach((ticket) => {
    if (!selectedTickets[ticket.id]) {
      selectedTickets[ticket.id] = 0;
    }
  });

  // Calculate total price
  $: totalPrice = ticketTypes.reduce((total, ticket) => {
    return total + ticket.price * (selectedTickets[ticket.id] || 0);
  }, 0);

  // Event details - will be populated after event loads
  let eventDetails: Array<{ icon: string; label: string; value: string }> = [];

  function handleQuantityChange(ticketId: number, newQuantity: number) {
    // Get the ticket type to check its specific constraints
    const ticketType = ticketTypes.find((t) => t.id === ticketId);
    if (!ticketType) return;

    // Validate against multiple constraints
    const maxSeatsPerOrder = event?.seating_options?.max_seats_per_order || 10;
    const eventTotalCapacity = event?.total_capacity || 100;
    const ticketTypeCapacity =
      ticketType.available_quantity || eventTotalCapacity;

    // Calculate current totals
    const otherTicketsTotal = Object.entries(selectedTickets)
      .filter(([id]) => parseInt(id) !== ticketId)
      .reduce((sum, [, qty]) => sum + qty, 0);

    // Validation checks - max seats per order is PER TICKET TYPE
    if (newQuantity > maxSeatsPerOrder) {
      alert(
        `Cannot select more than ${maxSeatsPerOrder} tickets of this type per order.`
      );
      return;
    }

    if (newQuantity > ticketTypeCapacity) {
      alert(
        `Cannot select more than ${ticketTypeCapacity} tickets for ${ticketType.name}.`
      );
      return;
    }

    // Check if total across all ticket types exceeds event capacity
    if (otherTicketsTotal + newQuantity > eventTotalCapacity) {
      alert(
        `Cannot select more than ${eventTotalCapacity} tickets total for this event.`
      );
      return;
    }

    selectedTickets[ticketId] = newQuantity;
    selectedTickets = { ...selectedTickets };
  }

  function handleAddToCart(ticketId: number) {
    const ticketType = ticketTypes.find((t) => t.id === ticketId);
    if (!ticketType) return;

    const currentQty = selectedTickets[ticketId] || 0;
    const maxSeatsPerOrder = event?.seating_options?.max_seats_per_order || 10;
    const eventTotalCapacity = event?.total_capacity || 100;
    const ticketTypeCapacity =
      ticketType.available_quantity || eventTotalCapacity;

    const otherTicketsTotal = Object.entries(selectedTickets)
      .filter(([id]) => parseInt(id) !== ticketId)
      .reduce((sum, [, qty]) => sum + qty, 0);

    // Validation checks - max seats per order is PER TICKET TYPE
    if (currentQty + 1 > maxSeatsPerOrder) {
      alert(
        `Cannot select more than ${maxSeatsPerOrder} tickets of this type per order.`
      );
      return;
    }

    if (currentQty + 1 > ticketTypeCapacity) {
      alert(
        `Cannot select more than ${ticketTypeCapacity} tickets for ${ticketType.name}.`
      );
      return;
    }

    // Check if total across all ticket types exceeds event capacity
    if (otherTicketsTotal + currentQty + 1 > eventTotalCapacity) {
      alert(
        `Cannot select more than ${eventTotalCapacity} tickets total for this event.`
      );
      return;
    }

    selectedTickets[ticketId] = currentQty + 1;
    selectedTickets = { ...selectedTickets };
  }

  function handlePayWithSolana() {
    // Payment logic will be implemented here
    console.log("Processing payment with Solana...", {
      selectedTickets,
      totalPrice,
    });
  }

  function handleGetFreeTicket() {
    // Validate quantity doesn't exceed available capacity
    const totalSelected = Object.values(selectedTickets).reduce(
      (sum, qty) => sum + qty,
      0
    );
    const maxSeatsPerOrder = event?.seating_options?.max_seats_per_order || 10;
    const eventTotalCapacity = event?.total_capacity || 100;

    if (totalSelected === 0) {
      alert("Please select at least 1 ticket.");
      return;
    }

    // Check if any individual ticket type exceeds max seats per order
    for (const [ticketId, quantity] of Object.entries(selectedTickets)) {
      if (quantity > maxSeatsPerOrder) {
        alert(
          `Cannot select more than ${maxSeatsPerOrder} tickets of any type per order.`
        );
        return;
      }
    }

    if (totalSelected > eventTotalCapacity) {
      alert(
        `Cannot select more than ${eventTotalCapacity} tickets total for this event.`
      );
      return;
    }

    // Handle free ticket claim
    console.log("Claiming free tickets...", {
      eventId: event.id,
      selectedTickets,
      totalQuantity: totalSelected,
      maxSeatsPerOrder,
      eventTotalCapacity,
    });

    // TODO: Implement actual free ticket claiming logic
    // This would typically involve:
    // 1. Calling an API to reserve the tickets
    // 2. Creating ticket records in the database
    // 3. Sending confirmation to user

    alert(
      `Successfully claimed ${totalSelected} free ticket(s) for ${event.name}!`
    );
  }

  onMount(async () => {
    try {
      console.log("Loading event with ID:", eventId);
      // Load event data from database
      const eventData = await getEventById(eventId);
      console.log("Event data received:", eventData);

      if (eventData) {
        // Determine if event is free based on price or is_free_event flag
        const isFreeEvent =
          eventData.is_free_event ||
          eventData.ticket_types?.[0]?.price === 0 ||
          eventData.ticket_types?.[0]?.price === "0" ||
          eventData.ticket_types?.[0]?.price === "NLe 0";

        console.log("Is free event:", isFreeEvent);
        console.log("Event capacity constraints:", {
          total_capacity: eventData.total_capacity,
          seating_options: eventData.seating_options,
          max_seats_per_order:
            eventData.seating_options?.[0]?.max_seats_per_order,
          ticket_types: eventData.ticket_types?.map((t: any) => ({
            id: t.id,
            name: t.name,
            price: t.price,
            available_quantity: t.available_quantity,
          })),
        });

        event = {
          id: eventData.id,
          name: eventData.name,
          date: new Date(eventData.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          venue: eventData.location,
          image:
            eventData.images?.[0]?.file_path ||
            "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop",
          price: isFreeEvent
            ? "Free"
            : `NLe ${eventData.ticket_types?.[0]?.price || 0}`,
          category: eventData.category || "General",
          description: eventData.description,
          time: eventData.time,
          organizer: eventData.organizer,
          total_capacity: eventData.total_capacity,
          ticket_types: eventData.ticket_types || [],
          venue_sections: eventData.venue_sections || [],
          seating_options: eventData.seating_options?.[0] || {
            max_seats_per_order: 10,
          },
          is_free_event: isFreeEvent,
        };

        console.log("Final event object:", event);
        console.log(
          "Max seats per order from event:",
          event.seating_options?.max_seats_per_order
        );

        // Update ticket types from database - always show actual ticket types
        if (eventData.ticket_types && eventData.ticket_types.length > 0) {
          ticketTypes = eventData.ticket_types.map((ticket: any) => ({
            id: ticket.id,
            name: ticket.name,
            price: ticket.price,
            description: ticket.description,
            features: ticket.benefits || [],
            available_quantity:
              ticket.available_quantity || eventData.total_capacity || 100,
          }));
        } else {
          // Fallback for events without ticket types
          ticketTypes = [
            {
              id: 999,
              name: isFreeEvent ? "Free Admission" : "General Admission",
              price: isFreeEvent ? 0 : 0,
              description: "General admission to the event",
              features: [
                "General admission",
                "Access to all event areas",
                isFreeEvent ? "No payment required" : "Standard access",
              ],
              available_quantity: eventData.total_capacity || 100,
            },
          ];
        }

        console.log("Ticket types from database:", eventData.ticket_types);
        console.log("Processed ticket types:", ticketTypes);

        // Populate event details after event is loaded
        eventDetails = [
          { icon: "calendar", label: "Date", value: event.date },
          { icon: "clock", label: "Time", value: eventData.time || "TBD" },
          { icon: "location", label: "Location", value: event.venue },
          { icon: "music", label: "Category", value: event.category },
          { icon: "users", label: "Organizer", value: event.organizer },
          {
            icon: "ticket",
            label: "Max per Order",
            value: `${event.seating_options?.max_seats_per_order || 10} per ticket type`,
          },
        ];
      } else {
        error = "Event not found";
      }
      loading = false;
    } catch (err) {
      console.error("Error loading event:", err);
      error = "Failed to load event";
      loading = false;
    }

    setTimeout(() => {
      pageLoaded = true;
    }, 100);
  });
</script>

<div class="min-h-screen bg-gray-900 text-white">
  {#if loading}
    <!-- Loading State -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"
        ></div>
        <p class="text-gray-400">Loading event details...</p>
      </div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 class="text-2xl font-bold text-white mb-2">Event Not Found</h1>
        <p class="text-gray-400 mb-6">{error}</p>
        <a
          href="/marketplace"
          class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
        >
          Back to Marketplace
        </a>
      </div>
    </div>
  {:else if event}
    <!-- Back Button -->
    <BackButton
      top="top-20"
      left="left-6"
      link="/marketplace"
      title="Back to Marketplace"
    />

    <!-- Share Button -->
    <ShareButton
      top="top-20"
      right="right-6"
      url={window.location.href}
      title={event.name}
      description={event.description || "Check out this amazing event!"}
    />

    <!-- Hero Section -->
    <EventHeroSection {event} />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Column - Event Information -->
        <div class="space-y-8">
          <!-- About the Event -->
          <EventDetailsCard
            title="About the Event"
            description={event.description ||
              "Experience this amazing event with world-class entertainment and unforgettable moments."}
          />

          <!-- Key Details -->
          <EventDetailsCard title="Key Details">
            <div class="space-y-4">
              {#each eventDetails as detail}
                <DetailItem
                  icon={detail.icon}
                  label={detail.label}
                  value={detail.value}
                />
              {/each}
            </div>
          </EventDetailsCard>
        </div>

        <!-- Right Column - Ticket Selection -->
        <div class="space-y-6">
          {#each ticketTypes as ticket}
            <TicketSelectionCard {ticket}>
              <div class="flex items-center justify-between mb-4">
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-white mb-2">
                    {ticket.name}
                  </h3>
                  <p class="text-gray-400 text-sm mb-3">{ticket.description}</p>
                  <div class="space-y-2">
                    {#each ticket.features as feature}
                      <div
                        class="flex items-center gap-2 text-sm text-gray-300"
                      >
                        <svg
                          class="h-4 w-4 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          ></path>
                        </svg>
                        {feature}
                      </div>
                    {/each}
                  </div>
                </div>
                <div class="text-right ml-4">
                  <div
                    class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
                  >
                    {ticket.price === 0 ? "Free" : `NLe ${ticket.price}`}
                  </div>
                  <div class="text-sm text-gray-400">/ ticket</div>
                  <div class="text-xs text-blue-400 mt-1">
                    Max {event?.seating_options?.max_seats_per_order || 10} per ticket
                    type
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <QuantitySelector
                  quantity={selectedTickets[ticket.id] || 0}
                  onQuantityChange={(newQuantity) =>
                    handleQuantityChange(ticket.id, newQuantity)}
                />
                <GradientButton
                  text={ticket.price === 0 ? "Select Quantity" : "Add to Cart"}
                  onClick={() => handleAddToCart(ticket.id)}
                  class_="flex-1"
                />
              </div>
            </TicketSelectionCard>
          {/each}

          <!-- Payment Summary -->
          <PaymentSummaryCard {totalPrice}>
            <!-- Max seats per order info -->
            <div
              class="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg"
            >
              <div class="flex items-center gap-2 text-blue-300 text-sm">
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span
                  >Maximum {event?.seating_options?.max_seats_per_order || 10} tickets
                  per ticket type</span
                >
              </div>
            </div>

            {#if event.is_free_event}
              <GradientButton
                text="Get Free Ticket"
                onClick={handleGetFreeTicket}
                icon="ticket"
                class_="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              />
            {:else}
              <GradientButton
                text="Pay with Solana"
                onClick={handlePayWithSolana}
                icon="wallet"
                class_="w-full"
                disabled={totalPrice === 0}
              />
            {/if}
          </PaymentSummaryCard>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Page load animation */
  .transition-all {
    transition-property: all;
  }

  .duration-1000 {
    transition-duration: 1000ms;
  }

  .ease-out {
    transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
</style>
