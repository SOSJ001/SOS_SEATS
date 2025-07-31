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
    selectedTickets[ticketId] = newQuantity;
    selectedTickets = { ...selectedTickets };
  }

  function handleAddToCart(ticketId: number) {
    selectedTickets[ticketId] = (selectedTickets[ticketId] || 0) + 1;
    selectedTickets = { ...selectedTickets };
  }

  function handlePayWithSolana() {
    // Payment logic will be implemented here
    console.log("Processing payment with Solana...", {
      selectedTickets,
      totalPrice,
    });
  }

  onMount(async () => {
    try {
      console.log("Loading event with ID:", eventId);
      // Load event data from database
      const eventData = await getEventById(eventId);
      console.log("Event data received:", eventData);
      if (eventData) {
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
          price: eventData.is_free_event
            ? "Free"
            : `NLe ${eventData.ticket_types?.[0]?.price || 0}`,
          category: eventData.category || "General",
          description: eventData.description,
          time: eventData.time,
          organizer: eventData.organizer,
          total_capacity: eventData.total_capacity,
          ticket_types: eventData.ticket_types || [],
          venue_sections: eventData.venue_sections || [],
        };

        // Update ticket types from database
        if (eventData.ticket_types && eventData.ticket_types.length > 0) {
          ticketTypes = eventData.ticket_types.map((ticket: any) => ({
            id: ticket.id,
            name: ticket.name,
            price: ticket.price,
            description: ticket.description,
            features: ticket.benefits || [],
          }));
        }

        // Populate event details after event is loaded
        eventDetails = [
          { icon: "calendar", label: "Date", value: event.date },
          { icon: "clock", label: "Time", value: eventData.time || "TBD" },
          { icon: "location", label: "Location", value: event.venue },
          { icon: "music", label: "Category", value: event.category },
          { icon: "users", label: "Organizer", value: event.organizer },
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
            description="Experience the ultimate electronic music festival featuring world-renowned DJs, stunning visual displays, and an unforgettable atmosphere. Join thousands of music lovers for a night of pure energy and excitement under the neon lights."
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
                    NLe {ticket.price}
                  </div>
                  <div class="text-sm text-gray-400">/ ticket</div>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <QuantitySelector
                  quantity={selectedTickets[ticket.id] || 0}
                  onQuantityChange={(newQuantity) =>
                    handleQuantityChange(ticket.id, newQuantity)}
                />
                <GradientButton
                  text="Add to Cart"
                  onClick={() => handleAddToCart(ticket.id)}
                  class_="flex-1"
                />
              </div>
            </TicketSelectionCard>
          {/each}

          <!-- Payment Summary -->
          <PaymentSummaryCard {totalPrice}>
            <GradientButton
              text="Pay with Solana"
              onClick={handlePayWithSolana}
              icon="wallet"
              class_="w-full"
              disabled={totalPrice === 0}
            />
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
