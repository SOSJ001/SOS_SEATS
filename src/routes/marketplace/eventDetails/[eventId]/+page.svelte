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
  import {
    handleMobileMoneyPaymentWithCode,
    calculatePlatformFee,
  } from "$lib/orangeMoneyPayment.js";
  import MobileMoneyPaymentModal from "$lib/components/MobileMoneyPaymentModal.svelte";
  import {
    sessionFromDb,
    walletStore,
    web3UserStore,
    showToast,
  } from "$lib/store";
  import EventHeroSection from "$lib/components/EventHeroSection.svelte";
  import EventDetailsCard from "$lib/components/EventDetailsCard.svelte";
  import TicketSelectionCard from "$lib/components/TicketSelectionCard.svelte";
  import PaymentSummaryCard from "$lib/components/PaymentSummaryCard.svelte";
  import DetailItem from "$lib/components/DetailItem.svelte";
  import GradientButton from "$lib/components/GradientButton.svelte";
  import QuantitySelector from "$lib/components/QuantitySelector.svelte";
  import BackButton from "$lib/components/BackButton.svelte";
  import ShareButton from "$lib/components/ShareButton.svelte";
  import ConfirmationDialog from "$lib/components/ConfirmationDialog.svelte";
  import GuestCheckoutModal from "$lib/components/GuestCheckoutModal.svelte";

  // Get event ID from URL params and load event data
  $: eventId = $page.params.eventId;
  let event: any = null;
  let loading = true;
  let error: string | null = null;

  // Ticket types with pricing - will be loaded from database
  let ticketTypes: Array<{
    id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    available_quantity: number;
  }> = [];

  // State management
  let selectedTickets: Record<string, number> = {};
  let pageLoaded = false;
  let claimingTickets = false;
  let processingPayment = false;
  let processingOrangeMoney = false;
  let processingAfrimoney = false;
  let showPaymentConfirmation = false;
  let showGuestCheckout = false;

  // Payment Code modal state
  let showPaymentModal = false;
  let paymentModalData: {
    paymentCodeId: string;
    ussdCode: string;
    amount: number;
    currency: string;
    paymentMethod: "orange_money" | "afrimoney";
    purchaseData: any;
  } | null = null;
  let paymentDetails: {
    totalTickets: number;
    ticketDetails: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    totalAmount: number;
    fromWallet: string;
    toWallet: string;
  } = {
    totalTickets: 0,
    ticketDetails: [],
    totalAmount: 0,
    fromWallet: "",
    toWallet: "HDCrEYrGwPBP2rqX1G7TqChzkN6ckRSpJBVF1YT1YPSF",
  };

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

  // Calculate platform fee for mobile money payments (disabled)
  $: platformFee = 0;

  // Calculate base total (ticket price only; no platform fee)
  $: baseTotal = totalPrice;

  // Calculate Monime's 1% processing fee
  $: monimeFee = baseTotal > 0 ? baseTotal * 0.01 : 0;

  // Total with platform fee and Monime fee (for mobile money)
  $: totalWithFee = baseTotal + monimeFee;

  // Event details - will be populated after event loads
  let eventDetails: Array<{ icon: string; label: string; value: string }> = [];

  function handleQuantityChange(ticketId: string, newQuantity: number) {
    // Get the ticket type to check its specific constraints
    const ticketType = ticketTypes.find((t) => t.id === ticketId);
    if (!ticketType) return;

    // Validate against multiple constraints
    const maxSeatsPerOrder = event?.seating_options?.max_seats_per_order || 10;
    const eventTotalCapacity = event?.total_capacity || 100;
    const ticketTypeCapacity = ticketType.available_quantity;

    // Calculate current totals
    const otherTicketsTotal = Object.entries(selectedTickets)
      .filter(([id]) => id !== ticketId)
      .reduce((sum, [, qty]) => sum + qty, 0);

    // Check if tickets are sold out
    if (ticketTypeCapacity <= 0) {
      showToast(
        "error",
        "Sold Out",
        `Sorry, ${ticketType.name} tickets are sold out.`
      );
      return;
    }

    // Validation checks - max seats per order is PER TICKET TYPE
    if (newQuantity > maxSeatsPerOrder) {
      showToast(
        "warning",
        "Quantity Limit",
        `Cannot select more than ${maxSeatsPerOrder} tickets of this type per order.`
      );
      return;
    }

    if (newQuantity > ticketTypeCapacity) {
      showToast(
        "warning",
        "Limited Availability",
        `Sorry, only ${ticketTypeCapacity} ${ticketType.name} tickets are available. You cannot select ${newQuantity} tickets.`
      );
      return;
    }

    // Check if total across all ticket types exceeds event capacity
    if (otherTicketsTotal + newQuantity > eventTotalCapacity) {
      showToast(
        "warning",
        "Event Capacity",
        `Cannot select more than ${eventTotalCapacity} tickets total for this event.`
      );
      return;
    }

    selectedTickets[ticketId] = newQuantity;
    selectedTickets = { ...selectedTickets };

    // Show success toast for quantity changes
    if (newQuantity > 0) {
      showToast(
        "success",
        "Quantity Updated",
        `Selected ${newQuantity} ${ticketType.name} ticket(s).`
      );
    }
  }

  function handleAddToCart(ticketId: string) {
    const ticketType = ticketTypes.find((t) => t.id === ticketId);
    if (!ticketType) return;

    const currentQty = selectedTickets[ticketId] || 0;
    const maxSeatsPerOrder = event?.seating_options?.max_seats_per_order || 10;
    const eventTotalCapacity = event?.total_capacity || 100;
    const ticketTypeCapacity = ticketType.available_quantity;

    const otherTicketsTotal = Object.entries(selectedTickets)
      .filter(([id]) => id !== ticketId)
      .reduce((sum, [, qty]) => sum + qty, 0);

    // Check if tickets are sold out
    if (ticketTypeCapacity <= 0) {
      showToast(
        "error",
        "Sold Out",
        `Sorry, ${ticketType.name} tickets are sold out.`
      );
      return;
    }

    // Validation checks - max seats per order is PER TICKET TYPE
    if (currentQty + 1 > maxSeatsPerOrder) {
      showToast(
        "warning",
        "Quantity Limit",
        `Cannot select more than ${maxSeatsPerOrder} tickets of this type per order.`
      );
      return;
    }

    if (currentQty + 1 > ticketTypeCapacity) {
      showToast(
        "warning",
        "Limited Availability",
        `Sorry, only ${ticketTypeCapacity} ${ticketType.name} tickets are available. You cannot select ${currentQty + 1} tickets.`
      );
      return;
    }

    // Check if total across all ticket types exceeds event capacity
    if (otherTicketsTotal + currentQty + 1 > eventTotalCapacity) {
      showToast(
        "warning",
        "Event Capacity",
        `Cannot select more than ${eventTotalCapacity} tickets total for this event.`
      );
      return;
    }

    selectedTickets[ticketId] = currentQty + 1;
    selectedTickets = { ...selectedTickets };

    showToast(
      "success",
      "Added to Cart",
      `Added 1 ${ticketType.name} ticket to your selection.`
    );
  }

  async function handlePayWithSolana() {
    // Web3 payments temporarily disabled
    showToast(
      "warning",
      "Under Maintenance",
      "Web3 payments are currently under maintenance. Please use Orange Money or Afrimoney instead."
    );
    return;

    // Validate wallet connection
    if (!connectedWalletAddress) {
      showToast(
        "error",
        "Wallet Required",
        "Please connect your wallet first to purchase tickets."
      );
      return;
    }

    // Validate ticket selection
    const totalSelected = Object.values(selectedTickets).reduce(
      (sum, qty) => sum + qty,
      0
    );

    if (totalSelected === 0) {
      showToast(
        "warning",
        "No Tickets Selected",
        "Please select at least 1 ticket to purchase."
      );
      return;
    }

    // Prevent multiple submissions
    if (processingPayment) {
      return;
    }

    processingPayment = true;

    try {
      // Show loading toast
      showToast(
        "info",
        "Processing Payment",
        "Please sign the transaction in your wallet..."
      );

      // Calculate total tickets and price from selected tickets
      let totalTickets = 0;
      let totalPrice = 0;
      let ticketDetails = [];

      for (const [ticketTypeId, quantity] of Object.entries(selectedTickets)) {
        if (quantity > 0) {
          const ticketType = ticketTypes.find((t) => t.id === ticketTypeId);
          if (ticketType) {
            totalTickets += quantity;
            totalPrice += ticketType.price * quantity;
            ticketDetails.push({
              id: ticketType.id,
              name: ticketType.name,
              price: ticketType.price,
              quantity: quantity,
            });
          }
        }
      }

      // Prepare payment details for confirmation dialog
      paymentDetails = {
        totalTickets,
        ticketDetails: ticketDetails as any,
        totalAmount: totalPrice,
        fromWallet: connectedWalletAddress || "",
        toWallet: "HDCrEYrGwPBP2rqX1G7TqChzkN6ckRSpJBVF1YT1YPSF",
      };

      // Show confirmation dialog
      showPaymentConfirmation = true;
      return;

      // Payment processing will be handled by processPayment() after confirmation
    } catch (error) {
      console.error("Payment setup error:", error);
      showToast(
        "error",
        "Setup Failed",
        `Failed to prepare payment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      processingPayment = false;
    }
  }

  async function processPayment() {
    // Web3 payments temporarily disabled
    showToast(
      "warning",
      "Under Maintenance",
      "Web3 payments are currently under maintenance. Please use Orange Money or Afrimoney instead."
    );
    return;

    if (!connectedWalletAddress) {
      showToast(
        "error",
        "Wallet Required",
        "Please connect your wallet first to purchase tickets."
      );
      return;
    }

    processingPayment = true;

    try {
      // Show loading toast
      showToast(
        "info",
        "Processing Payment",
        "Please sign the transaction in your wallet..."
      );

      // Create Solana transaction - use total amount divided by total tickets for average price
      const averagePricePerTicket =
        paymentDetails.totalAmount / paymentDetails.totalTickets;
      const result = await purchaseTicketsWithSolana(
        connectedWalletAddress,
        paymentDetails.totalTickets,
        averagePricePerTicket
      );

      if (!result || !result.transaction) {
        throw new Error("Failed to create transaction");
      }

      // Send transaction
      const transactionResult = await sendTransactionWithWallet(
        result.transaction
      );

      if (!transactionResult.success) {
        throw new Error(transactionResult.error || "Transaction failed");
      }

      // Show success toast for transaction signing
      showToast(
        "success",
        "Transaction Signed",
        "Payment successful! Creating your tickets..."
      );

      // Record the purchase in database
      const paymentInfo = {
        paymentMethod: "solana",
        transactionSignature: transactionResult.signature,
        amount: result.paymentDetails.amount,
        receivingWallet: result.paymentDetails.receivingWallet,
        buyerWallet: result.paymentDetails.buyerWallet,
      };

      const result2 = await claimFreeTickets(
        eventId,
        selectedTickets,
        {
          wallet_address: connectedWalletAddress,
          name: web3User?.display_name || web3User?.username || "Anonymous",
        },
        paymentInfo as any
      );

      if (result2.success) {
        showToast(
          "success",
          "Payment Successful",
          `Transaction: ${transactionResult.signature}\n\nRedirecting to confirmation page...`
        );
        goto(`/tickets/confirmation/${result2.orderId}`);
      } else {
        throw new Error(result2.error || "Failed to record purchase");
      }
    } catch (error) {
      console.error("Payment error:", error);
      showToast(
        "error",
        "Payment Failed",
        `Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      processingPayment = false;
      showPaymentConfirmation = false;
    }
  }

  async function handlePayWithOrangeMoney() {
    // Validate ticket selection
    const totalSelected = Object.values(selectedTickets).reduce(
      (sum, qty) => sum + qty,
      0
    );

    if (totalSelected === 0) {
      showToast(
        "warning",
        "No Tickets Selected",
        "Please select at least 1 ticket to purchase."
      );
      return;
    }

    // Limit Orange Money to 1 ticket per order
    if (totalSelected > 1) {
      showToast(
        "warning",
        "Orange Money Limitation",
        "Orange Money payments are currently limited to 1 ticket per order. Please select only 1 ticket or use Solana for multiple tickets."
      );
      return;
    }

    // Prevent multiple submissions
    if (processingOrangeMoney) {
      return;
    }

    processingOrangeMoney = true;

    try {
      // Show loading toast
      showToast(
        "info",
        "Setting up Orange Money Payment",
        "Creating payment code..."
      );

      // Calculate total tickets and price from selected tickets
      let totalTickets = 0;
      let totalPrice = 0;
      let ticketDetails = [];

      for (const [ticketTypeId, quantity] of Object.entries(selectedTickets)) {
        if (quantity > 0) {
          const ticketType = ticketTypes.find((t) => t.id === ticketTypeId);
          if (ticketType) {
            totalTickets += quantity;
            totalPrice += ticketType.price * quantity;
            ticketDetails.push({
              id: ticketType.id,
              name: ticketType.name,
              price: ticketType.price,
              quantity: quantity,
            });
          }
        }
      }

      // Calculate base total and Monime fee (no platform fee)
      const platformFee = 0;
      const baseTotal = totalPrice;
      const monimeFee = baseTotal * 0.01;
      const totalWithFee = baseTotal + monimeFee;

      // Prepare purchase data
      const purchaseData = {
        eventId,
        eventName: event?.name || "Event",
        selectedTickets,
        totalAmount: totalPrice,
        ticketDetails,
        buyerInfo: {
          wallet_address: connectedWalletAddress || undefined,
          name: web3User?.display_name || web3User?.username || "Guest User",
        },
      };

      // Create Payment Code for in-app payment (no redirect)
      const result = await handleMobileMoneyPaymentWithCode(
        purchaseData as any,
        "orange_money"
      );

      if (result.success && result.paymentCodeId && result.ussdCode) {
        // Show payment modal with USSD code
        paymentModalData = {
          paymentCodeId: result.paymentCodeId,
          ussdCode: result.ussdCode,
          amount: totalWithFee,
          currency: "NLe",
          paymentMethod: "orange_money",
          purchaseData,
        };
        showPaymentModal = true;
      } else {
        throw new Error(
          result.error || "Failed to create Orange Money payment code"
        );
      }
    } catch (error) {
      console.error("Orange Money payment error:", error);
      showToast(
        "error",
        "Payment Setup Failed",
        `Failed to setup Orange Money payment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      processingOrangeMoney = false;
    }
  }

  async function handlePayWithAfrimoney() {
    // Validate ticket selection
    const totalSelected = Object.values(selectedTickets).reduce(
      (sum, qty) => sum + qty,
      0
    );

    if (totalSelected === 0) {
      showToast(
        "warning",
        "No Tickets Selected",
        "Please select at least 1 ticket to purchase."
      );
      return;
    }

    // Limit Afrimoney to 1 ticket per order
    if (totalSelected > 1) {
      showToast(
        "warning",
        "Afrimoney Limitation",
        "Afrimoney payments are currently limited to 1 ticket per order. Please select only 1 ticket or use Solana for multiple tickets."
      );
      return;
    }

    // Prevent multiple submissions
    if (processingAfrimoney) {
      return;
    }

    processingAfrimoney = true;

    try {
      // Show loading toast
      showToast(
        "info",
        "Setting up Afrimoney Payment",
        "Creating payment code..."
      );

      // Calculate total tickets and price from selected tickets
      let totalTickets = 0;
      let totalPrice = 0;
      let ticketDetails = [];

      for (const [ticketTypeId, quantity] of Object.entries(selectedTickets)) {
        if (quantity > 0) {
          const ticketType = ticketTypes.find((t) => t.id === ticketTypeId);
          if (ticketType) {
            totalTickets += quantity;
            totalPrice += ticketType.price * quantity;
            ticketDetails.push({
              id: ticketType.id,
              name: ticketType.name,
              price: ticketType.price,
              quantity: quantity,
            });
          }
        }
      }

      // Calculate base total and Monime fee (no platform fee)
      const platformFee = 0;
      const baseTotal = totalPrice;
      const monimeFee = baseTotal * 0.01;
      const totalWithFee = baseTotal + monimeFee;

      // Prepare purchase data
      const purchaseData = {
        eventId,
        eventName: event?.name || "Event",
        selectedTickets,
        totalAmount: totalPrice,
        ticketDetails,
        buyerInfo: {
          wallet_address: connectedWalletAddress || undefined,
          name: web3User?.display_name || web3User?.username || "Guest User",
        },
      };

      // Create Payment Code for in-app payment (no redirect)
      const result = await handleMobileMoneyPaymentWithCode(
        purchaseData as any,
        "afrimoney"
      );

      if (result.success && result.paymentCodeId && result.ussdCode) {
        // Show payment modal with USSD code
        paymentModalData = {
          paymentCodeId: result.paymentCodeId,
          ussdCode: result.ussdCode,
          amount: totalWithFee,
          currency: "NLe",
          paymentMethod: "afrimoney",
          purchaseData,
        };
        showPaymentModal = true;
      } else {
        throw new Error(
          result.error || "Failed to create Afrimoney payment code"
        );
      }
    } catch (error) {
      console.error("Afrimoney payment error:", error);
      showToast(
        "error",
        "Payment Setup Failed",
        `Failed to setup Afrimoney payment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      processingAfrimoney = false;
    }
  }

  async function handleGuestCheckout() {
    // Validate ticket selection
    const totalSelected = Object.values(selectedTickets).reduce(
      (sum, qty) => sum + qty,
      0
    );

    if (totalSelected === 0) {
      showToast(
        "warning",
        "No Tickets Selected",
        "Please select at least 1 ticket to purchase."
      );
      return;
    }

    // Show guest checkout modal
    showGuestCheckout = true;
  }

  function handleGuestPaymentSuccess(event: CustomEvent) {
    const { accessToken, paymentMethod } = event.detail;
    const paymentMethodText =
      paymentMethod === "orange_money" ? "Orange Money" : "Card";
    showToast(
      "success",
      "Payment Successful!",
      `Your ${paymentMethodText} payment was processed. Tickets are ready for download.`
    );
    showGuestCheckout = false;
    // Redirect to guest ticket page
    goto(`/tickets/guest/${accessToken}`);
  }

  function handleConnectWalletFromGuest() {
    showGuestCheckout = false;
    // Trigger wallet connection (you can implement this based on your existing wallet connection logic)
    showToast(
      "info",
      "Connect Wallet",
      "Please connect your wallet to access Web3 features."
    );
  }

  async function handleGetFreeTicket() {
    // Check if wallet is connected - required for free tickets
    if (!connectedWalletAddress) {
      showToast(
        "warning",
        "Wallet Required",
        "Please connect your wallet to claim free tickets. This ensures your tickets are properly linked to your wallet address."
      );
      return;
    }

    // Validate quantity doesn't exceed available capacity
    const totalSelected = Object.values(selectedTickets).reduce(
      (sum, qty) => sum + qty,
      0
    );
    const maxSeatsPerOrder = event?.seating_options?.max_seats_per_order || 10;
    const eventTotalCapacity = event?.total_capacity || 100;

    if (totalSelected === 0) {
      showToast(
        "warning",
        "No Tickets Selected",
        "Please select at least 1 ticket."
      );
      return;
    }

    // Check if any individual ticket type exceeds max seats per order
    for (const [ticketId, quantity] of Object.entries(selectedTickets)) {
      if (quantity > maxSeatsPerOrder) {
        showToast(
          "warning",
          "Quantity Limit",
          `Cannot select more than ${maxSeatsPerOrder} tickets of any type per order.`
        );
        return;
      }
    }

    if (totalSelected > eventTotalCapacity) {
      showToast(
        "warning",
        "Event Capacity",
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
      // Show loading toast
      showToast("info", "Processing Claim", "Creating your free tickets...");

      // Get current user session - wallet is required for free tickets
      let userData: {
        id: string | null;
        email: string | null;
        name: string;
        wallet_address: string;
      } = {
        id: null,
        email: null,
        name: "Web3 User",
        wallet_address: connectedWalletAddress, // We know this exists due to the check above
      };

      // Try to get Web3 session and profile for better user data
      const web3Session = await verifyWeb3Session();

      if (web3Session.success && web3Session.user) {
        // Get Web3 user profile
        const profile = await getWeb3UserProfile(connectedWalletAddress);

        if (profile.success && profile.user) {
          userData = {
            id: profile.user.id,
            email: null, // Web3 users don't have email
            name:
              profile.user.display_name || profile.user.username || "Web3 User",
            wallet_address: profile.user.wallet_address,
          };
        } else {
          // Use basic Web3 session data with connected wallet
          userData = {
            id: web3Session.user.id,
            email: null,
            name: web3Session.user.username || "Web3 User",
            wallet_address: connectedWalletAddress,
          };
        }
      } else {
        // Use connected wallet directly
        userData = {
          id: null,
          email: null,
          name: web3User?.display_name || web3User?.username || "Web3 User",
          wallet_address: connectedWalletAddress,
        };
      }

      // Call the actual free ticket claiming function
      const result = await claimFreeTickets(
        event.id,
        selectedTickets,
        userData
      );

      if (result.success) {
        showToast(
          "success",
          "Free Tickets Claimed",
          `🎉 Successfully claimed ${result.ticketsClaimed} ticket(s)!\n\nOrder: ${result.orderNumber}\n\nRedirecting to confirmation...`
        );

        // Reset selected tickets
        selectedTickets = {};
        selectedTickets = { ...selectedTickets };

        // Redirect to ticket confirmation page
        goto(`/tickets/confirmation/${result.orderId}`);
      } else {
        throw new Error(result.error || "Failed to claim tickets");
      }
    } catch (error: any) {
      showToast(
        "error",
        "Claim Failed",
        `❌ An error occurred while claiming tickets: ${error?.message || "Unknown error"}\n\nPlease try again.`
      );
    } finally {
      claimingTickets = false;
    }
  }

  onMount(async () => {
    // Check if payment was cancelled
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("payment") === "cancelled") {
      showToast(
        "warning",
        "Payment Cancelled",
        "Your payment was cancelled. You can try again or choose a different payment method."
      );
      // Clean up URL by removing the query parameter
      window.history.replaceState(
        {},
        "",
        `/marketplace/eventDetails/${eventId}`
      );
    }

    // Clean up any old checkout session URL parameters
    // Payment codes handle cancellation in the modal, so this is no longer needed
    const sessionId = urlParams.get("session_id") || urlParams.get("s");
    if (sessionId && !urlParams.get("payment") && !urlParams.has("success")) {
      // Remove old session parameters from URL
      window.history.replaceState(
        {},
        "",
        `/marketplace/eventDetails/${eventId}`
      );
    }

    try {
      // Load event data from database
      const eventData = await getEventById(eventId);

      if (eventData) {
        // Determine if event is free based on all ticket types having zero price
        const isFreeEvent =
          eventData.is_free_event ||
          (eventData.ticket_types &&
            eventData.ticket_types.length > 0 &&
            eventData.ticket_types.every((ticket: any) => {
              const price =
                typeof ticket.price === "string"
                  ? parseFloat(ticket.price)
                  : ticket.price;
              return price === 0 || price === null || price === undefined;
            }));

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
            price:
              typeof ticket.price === "string"
                ? parseFloat(ticket.price)
                : ticket.price,
            description: ticket.description,
            features: ticket.benefits || [],
            available_quantity: Math.max(
              0,
              (ticket.quantity || 0) - (ticket.sold_quantity || 0)
            ),
          }));
        } else {
          // Fallback for events without ticket types
          ticketTypes = [
            {
              id: "fallback-ticket-type",
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
              <!-- Sold Out Overlay -->
              {#if ticket.available_quantity <= 0}
                <div
                  class="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center z-10"
                >
                  <div class="text-center">
                    <div class="text-red-400 text-2xl font-bold mb-2">
                      SOLD OUT
                    </div>
                    <div class="text-gray-400 text-sm">
                      No tickets available
                    </div>
                  </div>
                </div>
              {/if}

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
                  <!-- Available Quantity Display -->
                  <div
                    class="text-xs mt-1 {ticket.available_quantity <= 0
                      ? 'text-red-400'
                      : ticket.available_quantity < 10
                        ? 'text-yellow-400'
                        : 'text-gray-400'}"
                  >
                    {ticket.available_quantity <= 0
                      ? "Sold Out"
                      : ticket.available_quantity < 10
                        ? `Only ${ticket.available_quantity} left!`
                        : `${ticket.available_quantity} available`}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <QuantitySelector
                  quantity={selectedTickets[ticket.id] || 0}
                  availableQuantity={ticket.available_quantity}
                  onQuantityChange={(newQuantity) =>
                    handleQuantityChange(ticket.id, newQuantity)}
                />
                <GradientButton
                  text={ticket.price === 0 ? "Select Quantity" : "Add to Cart"}
                  onClick={() => handleAddToCart(ticket.id)}
                  class_="flex-1"
                  disabled={ticket.available_quantity <= 0}
                />
              </div>
            </TicketSelectionCard>
          {/each}

          <!-- Payment Summary -->
          <PaymentSummaryCard
            totalPrice={totalWithFee}
            currency="NLe"
            pricePerTicket={event?.is_free_event
              ? 0
              : totalPrice /
                Object.values(selectedTickets).reduce(
                  (sum, qty) => sum + qty,
                  0
                )}
            {platformFee}
            {monimeFee}
            showFeeBreakdown={platformFee > 0 || monimeFee > 0}
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
                    ? "Wallet connection required to claim free tickets"
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
                disabled={claimingTickets || !connectedWalletAddress}
              />
            {:else}
              <!-- Paid Event: Show different buttons based on wallet connection -->
              {#if connectedWalletAddress}
                <!-- Web3 User: Show Solana payment -->
                <GradientButton
                  text={processingPayment
                    ? "Processing Payment..."
                    : "Pay with Solana"}
                  onClick={handlePayWithSolana}
                  icon={processingPayment ? "loading" : "wallet"}
                  class_="w-full"
                  disabled={totalPrice === 0 || processingPayment}
                />
                <div
                  class="mt-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <svg
                      class="w-4 h-4 text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    <span class="text-xs font-semibold text-blue-400"
                      >Web3 Benefits</span
                    >
                  </div>
                  <p class="text-xs text-blue-300">
                    Lower fees • Transferable • Verifiable on blockchain
                  </p>
                </div>
              {:else}
                <!-- Non-Web3 User: Show Mobile Money Payment Options -->

                <!-- Commented out Guest Checkout -->
                <!-- <GradientButton
                  text="💳 Guest Checkout"
                  onClick={handleGuestCheckout}
                  icon="credit-card"
                  class_="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  disabled={totalPrice === 0}
                /> -->

                <!-- Orange Money Payment Option -->
                <GradientButton
                  text={processingOrangeMoney
                    ? "Processing..."
                    : "🍊 Pay with Orange Money"}
                  onClick={handlePayWithOrangeMoney}
                  icon={processingOrangeMoney ? "loading" : "mobile"}
                  class_="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  disabled={totalPrice === 0 || processingOrangeMoney}
                />

                <!-- Afrimoney Payment Option -->
                <GradientButton
                  text={processingAfrimoney
                    ? "Processing..."
                    : "💚 Pay with Afrimoney"}
                  onClick={handlePayWithAfrimoney}
                  icon={processingAfrimoney ? "loading" : "mobile"}
                  class_="w-full mt-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  disabled={totalPrice === 0 || processingAfrimoney}
                />
                <!-- Orange Money Info -->
                <div
                  class="mt-2 p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <svg
                      class="w-4 h-4 text-orange-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    <span class="text-xs font-semibold text-orange-400"
                      >Orange Money Benefits</span
                    >
                  </div>
                  <p class="text-xs text-orange-300">
                    Secure mobile payments • No wallet required • Instant
                    confirmation
                  </p>
                  <p class="text-xs text-orange-200 mt-1 font-medium">
                    ⚠️ Limited to 1 ticket per order
                  </p>
                </div>

                <!-- Afrimoney Info -->
                <div
                  class="mt-2 p-3 bg-green-900/20 border border-green-500/30 rounded-lg"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <svg
                      class="w-4 h-4 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    <span class="text-xs font-semibold text-green-400"
                      >Afrimoney Benefits</span
                    >
                  </div>
                  <p class="text-xs text-green-300">
                    Secure mobile payments • No wallet required • Instant
                    confirmation
                  </p>
                  <p class="text-xs text-green-200 mt-1 font-medium">
                    ⚠️ Limited to 1 ticket per order
                  </p>
                </div>

                <div
                  class="mt-2 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <svg
                      class="w-4 h-4 text-purple-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    <span class="text-xs font-semibold text-purple-400"
                      >Want Web3 benefits?</span
                    >
                  </div>
                  <p class="text-xs text-purple-300">
                    Connect wallet for lower fees & transferable tickets
                  </p>
                </div>
              {/if}
            {/if}
          </PaymentSummaryCard>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Payment Confirmation Dialog -->
<ConfirmationDialog
  bind:show={showPaymentConfirmation}
  title="Confirm Payment"
  message="Total Tickets: {paymentDetails.totalTickets} | Total Amount: {paymentDetails.totalAmount} SOL | From: {paymentDetails.fromWallet.slice(
    0,
    6
  )}...{paymentDetails.fromWallet.slice(
    -4
  )} | To: {paymentDetails.toWallet.slice(
    0,
    6
  )}...{paymentDetails.toWallet.slice(
    -4
  )} | ⚠️ Please ensure you have sufficient SOL balance in your wallet."
  confirmText="Confirm Payment"
  cancelText="Cancel"
  confirmVariant="success"
  loading={processingPayment}
  on:confirm={processPayment}
  on:cancel={() => {
    showPaymentConfirmation = false;
    processingPayment = false;
  }}
/>

<!-- Guest Checkout Modal -->
<GuestCheckoutModal
  bind:show={showGuestCheckout}
  totalAmount={totalPrice}
  eventName={event?.name || "Event"}
  on:success={handleGuestPaymentSuccess}
  on:connectWallet={handleConnectWalletFromGuest}
  on:close={() => (showGuestCheckout = false)}
/>

{#if paymentModalData}
  <MobileMoneyPaymentModal
    bind:show={showPaymentModal}
    paymentCodeId={paymentModalData.paymentCodeId}
    ussdCode={paymentModalData.ussdCode}
    amount={paymentModalData.amount}
    currency={paymentModalData.currency}
    paymentMethod={paymentModalData.paymentMethod}
    purchaseData={paymentModalData.purchaseData}
    on:close={() => {
      showPaymentModal = false;
      paymentModalData = null;
    }}
    on:success={(e) => {
      const { orderId } = e.detail;
      // Redirect to confirmation page
      goto(`/tickets/confirmation/${orderId}`);
      showPaymentModal = false;
      paymentModalData = null;
    }}
  />
{/if}

<style>
  /* Page load animation */
  .transition-all {
    transition-property: all;
  }
</style>
