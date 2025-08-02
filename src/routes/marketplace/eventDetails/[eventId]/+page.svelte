<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    getEventById,
    claimFreeTickets,
    verifyWeb3Session,
    getWeb3UserProfile,
  } from "$lib/supabase.js";
  import {
    purchaseTicketsWithSolana,
    sendTransactionWithWallet,
  } from "$lib/web3";
  import { sessionFromDb, walletStore, web3UserStore } from "$lib/store";
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
  let claimingTickets = false;
  let processingPayment = false;

  // Wallet connection state
  $: connectedWalletAddress = $walletStore?.address || null;
  $: web3User = $web3UserStore?.user || null;

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

  async function handlePayWithSolana() {
    // Validate wallet connection
    if (!connectedWalletAddress) {
      alert("Please connect your wallet first to purchase tickets.");
      return;
    }

    // Validate ticket selection
    const totalSelected = Object.values(selectedTickets).reduce(
      (sum, qty) => sum + qty,
      0
    );

    if (totalSelected === 0) {
      alert("Please select at least 1 ticket to purchase.");
      return;
    }

    // Prevent multiple submissions
    if (processingPayment) {
      return;
    }

    processingPayment = true;

    try {
      // Calculate total tickets and price
      const totalTickets = totalSelected;
      const pricePerTicket = 0.01; // Default price as specified
      const totalPrice = totalTickets * pricePerTicket;

      // Show confirmation dialog
      const confirmed = confirm(
        `Confirm Purchase:\n\n` +
          `Tickets: ${totalTickets}\n` +
          `Price per ticket: ${pricePerTicket} SOL\n` +
          `Total: ${totalPrice} SOL\n\n` +
          `From: ${connectedWalletAddress.slice(0, 6)}...${connectedWalletAddress.slice(-4)}\n` +
          `To: HDCrEYrGwPBP2rqX1G7TqChzkN6ckRSpJBVF1YT1YPSF\n\n` +
          `Proceed with purchase?`
      );

      if (!confirmed) {
        processingPayment = false;
        return;
      }

      // Create purchase transaction
      const purchaseResult = await purchaseTicketsWithSolana(
        connectedWalletAddress,
        totalTickets,
        pricePerTicket
      );

      if (!purchaseResult.success) {
        throw new Error(purchaseResult.error);
      }

      // Send transaction
      const sendResult = await sendTransactionWithWallet(
        purchaseResult.transaction!
      );

      if (!sendResult.success) {
        throw new Error(sendResult.error);
      }

      // Success! Create order in database
      const userData = {
        id: null,
        email: null,
        name: web3User?.display_name || web3User?.username || "Web3 User",
        wallet_address: connectedWalletAddress,
      };

      // Call the ticket claiming function with payment info
      const result = await claimFreeTickets(
        event.id,
        selectedTickets,
        userData,
        {
          paymentMethod: "solana",
          transactionSignature: sendResult.signature,
          amount: purchaseResult.totalAmount || 0,
          receivingWallet: purchaseResult.receivingWalletAddress || "",
          buyerWallet: purchaseResult.fromWalletAddress || "",
        } as any
      );

      if (result.success) {
        alert(
          `🎉 Payment successful!\n\n` +
            `Transaction: ${sendResult.signature.slice(0, 8)}...${sendResult.signature.slice(-8)}\n` +
            `Amount: ${purchaseResult.totalAmount} SOL\n` +
            `Tickets: ${totalTickets}\n\n` +
            `Redirecting to your ticket confirmation...`
        );

        // Reset selected tickets
        selectedTickets = {};
        selectedTickets = { ...selectedTickets };

        // Redirect to ticket confirmation page
        goto(`/tickets/confirmation/${result.orderId}`);
      } else {
        throw new Error(result.error || "Failed to create order");
      }
    } catch (error: any) {
      alert(
        `❌ Payment failed: ${error?.message || "Unknown error"}\n\nPlease try again.`
      );
    } finally {
      processingPayment = false;
    }
  }

  async function handleGetFreeTicket() {
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

    // Prevent multiple submissions
    if (claimingTickets) {
      return;
    }

    claimingTickets = true;

    try {
      // Get current user session - try Web3 first, then fallback to traditional
      let userData: {
        id: string | null;
        email: string | null;
        name: string;
        wallet_address: string | null;
      } = {
        id: null,
        email: null,
        name: "Event Attendee",
        wallet_address: null,
      };

      // Get the connected wallet address from the store (already available as reactive variables)

      // Try to get Web3 session first
      const web3Session = await verifyWeb3Session();

      if (web3Session.success && web3Session.user) {
        // Use the connected wallet address if available, otherwise fall back to session
        const walletAddressToUse =
          connectedWalletAddress || web3Session.user.wallet_address;

        if (walletAddressToUse && walletAddressToUse !== "undefined") {
          // Get Web3 user profile
          const profile = await getWeb3UserProfile(walletAddressToUse);

          if (profile.success && profile.user) {
            userData = {
              id: profile.user.id,
              email: null, // Web3 users don't have email
              name:
                profile.user.display_name ||
                profile.user.username ||
                "Web3 User",
              wallet_address: profile.user.wallet_address,
            };
          } else {
            // Use basic Web3 session data with connected wallet
            userData = {
              id: web3Session.user.id,
              email: null,
              name: web3Session.user.username || "Web3 User",
              wallet_address: walletAddressToUse,
            };
          }
        } else {
          // No valid wallet address, use basic session data
          userData = {
            id: web3Session.user.id,
            email: null,
            name: web3Session.user.username || "Web3 User",
            wallet_address: "0x1234567890abcdef" as string, // Fallback wallet address
          };
        }
      } else {
        // No Web3 session, try to use connected wallet directly
        if (connectedWalletAddress) {
          userData = {
            id: null,
            email: null,
            name: web3User?.display_name || web3User?.username || "Web3 User",
            wallet_address: connectedWalletAddress,
          };
        } else {
          // Fallback to traditional session
          const currentSession = $sessionFromDb;
          userData = {
            id: currentSession,
            email: null,
            name: "Event Attendee",
            wallet_address: "0x1234567890abcdef" as string, // Fallback wallet address
          };
        }
      }

      // Call the actual free ticket claiming function
      const result = await claimFreeTickets(
        event.id,
        selectedTickets,
        userData
      );

      if (result.success) {
        // Success! Show brief confirmation before redirect
        if (result.isTemporary) {
          alert(
            `🎉 Successfully claimed ${result.ticketsClaimed} free ticket(s)!\n\nNote: Order stored locally (database access restricted).\n\nRedirecting to your ticket confirmation...`
          );
        } else {
          alert(
            `🎉 Successfully claimed ${result.ticketsClaimed} free ticket(s)!\n\nRedirecting to your ticket confirmation...`
          );
        }

        // Reset selected tickets
        selectedTickets = {};
        selectedTickets = { ...selectedTickets };

        // Redirect to ticket confirmation page
        goto(`/tickets/confirmation/${result.orderId}`);
      } else {
        // Handle error
        alert(
          `❌ Failed to claim tickets: ${result.error}\n\nPlease try again or contact support.`
        );
      }
    } catch (error: any) {
      alert(
        `❌ An error occurred while claiming tickets: ${error?.message || "Unknown error"}\n\nPlease try again.`
      );
    } finally {
      claimingTickets = false;
    }
  }

  onMount(async () => {
    try {
      // Load event data from database
      const eventData = await getEventById(eventId);

      if (eventData) {
        // Determine if event is free based on price or is_free_event flag
        const isFreeEvent =
          eventData.is_free_event ||
          eventData.ticket_types?.[0]?.price === 0 ||
          eventData.ticket_types?.[0]?.price === "0" ||
          eventData.ticket_types?.[0]?.price === "NLe 0";

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
          <PaymentSummaryCard
            {totalPrice}
            currency={event?.is_free_event ? "NLe" : "SOL"}
            pricePerTicket={0.01}
          >
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

            <!-- Wallet Connection Status -->
            <div
              class="mb-4 p-3 bg-gray-800/50 border border-gray-600/30 rounded-lg"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg
                    class="h-4 w-4 {connectedWalletAddress
                      ? 'text-green-400'
                      : 'text-yellow-400'}"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span class="text-sm text-gray-300">
                    {connectedWalletAddress
                      ? "Wallet Connected"
                      : "No Wallet Connected"}
                  </span>
                </div>
                {#if connectedWalletAddress}
                  <div class="text-xs text-blue-400 font-mono">
                    {connectedWalletAddress.slice(
                      0,
                      6
                    )}...{connectedWalletAddress.slice(-4)}
                  </div>
                {/if}
              </div>
              {#if !connectedWalletAddress}
                <div class="text-xs text-yellow-400 mt-1">
                  {event?.is_free_event
                    ? "Connect your wallet to claim tickets with your address"
                    : "Connect your wallet to purchase tickets with SOL"}
                </div>
              {/if}
            </div>

            {#if event.is_free_event}
              <GradientButton
                text={claimingTickets
                  ? "Claiming Tickets..."
                  : "Get Free Ticket"}
                onClick={handleGetFreeTicket}
                icon={claimingTickets ? "loading" : "ticket"}
                class_="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                disabled={claimingTickets}
              />
            {:else}
              <GradientButton
                text={processingPayment
                  ? "Processing Payment..."
                  : "Pay with Solana"}
                onClick={handlePayWithSolana}
                icon={processingPayment ? "loading" : "wallet"}
                class_="w-full"
                disabled={totalPrice === 0 ||
                  processingPayment ||
                  !connectedWalletAddress}
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
