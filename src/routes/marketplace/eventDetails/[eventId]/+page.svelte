<!--
  Event Details Page
  ===================
  
  This page displays detailed information about a specific event and allows users to:
  - View event information (date, location, description, etc.)
  - Select ticket types and quantities
  - Purchase tickets using multiple payment methods:
    * Solana/Web3 payments (currently disabled for maintenance)
    * Orange Money (mobile money)
    * Afrimoney (mobile money)
  - Claim free tickets (for free events)
  
  The page handles:
  - Event data loading from Supabase
  - Ticket quantity validation (max per order, available quantity, event capacity)
  - Payment processing for different methods
  - Wallet connection state management
  - Guest checkout flow
  
  Route: /marketplace/eventDetails/[eventId]
-->

<script lang="ts">
  // ============================================================================
  // IMPORTS
  // ============================================================================

  // SvelteKit stores and utilities
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  // Supabase database functions
  import {
    getEventById,
    claimFreeTickets,
    verifyWeb3Session,
    getWeb3UserProfile,
  } from "$lib/supabase.js";

  // Web3/Solana payment functions
  import {
    purchaseTicketsWithSolana,
    sendTransactionWithWallet,
  } from "$lib/web3";

  // Mobile money payment functions
  import {
    handleMobileMoneyPaymentWithCode,
    calculatePlatformFee,
  } from "$lib/orangeMoneyPayment.js";

  // Global stores
  import {
    sessionFromDb,
    walletStore,
    web3UserStore,
    showToast,
  } from "$lib/store";

  // UI Components
  import MobileMoneyPaymentModal from "$lib/components/MobileMoneyPaymentModal.svelte";
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

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  // Mobile money payment provider logos (static assets served from /static directory)
  const orangeMoneyLogo = "/orangeMoney.png";
  const afriMoneyLogo = "/afriMoney.png";

  // ============================================================================
  // REACTIVE STATE - Event Data
  // ============================================================================

  // Extract event ID from URL route parameter
  $: eventId = $page.params.eventId;

  // Main event object containing all event details
  let event: any = null;

  // Loading state for initial event data fetch
  let loading = true;

  // Error message if event loading fails
  let error: string | null = null;

  // ============================================================================
  // REACTIVE STATE - Ticket Data
  // ============================================================================

  // Array of available ticket types for this event (loaded from database)
  let ticketTypes: Array<{
    id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    available_quantity: number;
  }> = [];

  // ============================================================================
  // REACTIVE STATE - User Selection & UI State
  // ============================================================================

  // Map of ticket type IDs to selected quantities
  // Format: { [ticketTypeId]: quantity }
  let selectedTickets: Record<string, number> = {};

  // Flag to indicate page has finished initial load animation
  let pageLoaded = false;

  // Loading states for different operations
  let claimingTickets = false; // Free ticket claiming in progress
  let processingPayment = false; // Solana payment in progress
  let processingOrangeMoney = false; // Orange Money payment in progress
  let processingAfrimoney = false; // Afrimoney payment in progress

  // Modal visibility flags
  let showPaymentConfirmation = false; // Solana payment confirmation dialog
  let showGuestCheckout = false; // Guest checkout modal

  // ============================================================================
  // REACTIVE STATE - Payment Modal Data
  // ============================================================================

  // Controls visibility of mobile money payment modal (USSD code display)
  let showPaymentModal = false;

  // Data passed to mobile money payment modal
  let paymentModalData: {
    paymentCodeId: string; // Monime payment code ID for polling
    ussdCode: string; // USSD code to dial for payment
    amount: number; // Total amount including fees
    currency: string; // Currency code (e.g., "NLe")
    paymentMethod: "orange_money" | "afrimoney";
    purchaseData: any; // Full purchase data for order creation
  } | null = null;

  // Payment details for Solana payment confirmation dialog
  let paymentDetails: {
    totalTickets: number;
    ticketDetails: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    totalAmount: number; // Total in SOL
    fromWallet: string; // Buyer's wallet address
    toWallet: string; // Platform receiving wallet
  } = {
    totalTickets: 0,
    ticketDetails: [],
    totalAmount: 0,
    fromWallet: "",
    toWallet: "HDCrEYrGwPBP2rqX1G7TqChzkN6ckRSpJBVF1YT1YPSF", // Platform wallet
  };

  // ============================================================================
  // REACTIVE STATE - Wallet Connection
  // ============================================================================

  // Currently connected Solana wallet address (null if not connected)
  $: connectedWalletAddress = $walletStore?.address || null;

  // Web3 user profile data (if wallet is connected and user is authenticated)
  $: web3User = $web3UserStore?.user || null;

  // ============================================================================
  // REACTIVE STATEMENTS - Initialization & Calculations
  // ============================================================================

  /**
   * Initialize selectedTickets object with all ticket types set to 0
   * Runs whenever ticketTypes array changes
   */
  $: ticketTypes.forEach((ticket) => {
    if (!selectedTickets[ticket.id]) {
      selectedTickets[ticket.id] = 0;
    }
  });

  /**
   * Calculate total price based on selected tickets
   * Sums up: (ticket price × quantity) for each selected ticket type
   */
  $: totalPrice = ticketTypes.reduce((total, ticket) => {
    return total + ticket.price * (selectedTickets[ticket.id] || 0);
  }, 0);

  /**
   * Platform fee for mobile money payments
   * Currently disabled (set to 0)
   */
  $: platformFee = 0;

  /**
   * Base total (ticket prices only, no fees)
   * Used as the base for fee calculations
   */
  $: baseTotal = totalPrice;

  /**
   * Monime processing fee
   * 1% of the base total (charged by Monime payment gateway)
   */
  $: monimeFee = baseTotal > 0 ? baseTotal * 0.01 : 0;

  /**
   * Total amount including all fees
   * Used for mobile money payments (baseTotal + monimeFee)
   */
  $: totalWithFee = baseTotal + monimeFee;

  // ============================================================================
  // STATE - Event Details Display
  // ============================================================================

  // Array of event detail items to display in the Key Details section
  // Populated after event data is loaded
  let eventDetails: Array<{ icon: string; label: string; value: string }> = [];

  // ============================================================================
  // FUNCTIONS - Ticket Selection & Validation
  // ============================================================================

  /**
   * Handles quantity changes from the QuantitySelector component
   *
   * Validates the new quantity against multiple constraints:
   * 1. Ticket type availability (not sold out)
   * 2. Max seats per order (per ticket type)
   * 3. Available quantity for this ticket type
   * 4. Total event capacity (across all ticket types)
   *
   * @param ticketId - The ID of the ticket type being modified
   * @param newQuantity - The new quantity value from the selector
   */
  function handleQuantityChange(ticketId: string, newQuantity: number) {
    // Get the ticket type to check its specific constraints
    const ticketType = ticketTypes.find((t) => t.id === ticketId);
    if (!ticketType) return;

    // Extract validation constraints from event and ticket data
    const maxSeatsPerOrder = event?.seating_options?.max_seats_per_order || 10;
    const eventTotalCapacity = event?.total_capacity || 100;
    const ticketTypeCapacity = ticketType.available_quantity;

    // Calculate total quantity of other ticket types (excluding current one)
    // Used to check if total exceeds event capacity
    const otherTicketsTotal = Object.entries(selectedTickets)
      .filter(([id]) => id !== ticketId)
      .reduce((sum, [, qty]) => sum + qty, 0);

    // Validation 1: Check if tickets are sold out
    if (ticketTypeCapacity <= 0) {
      showToast(
        "error",
        "Sold Out",
        `Sorry, ${ticketType.name} tickets are sold out.`
      );
      return;
    }

    // Validation 2: Max seats per order is PER TICKET TYPE (not total)
    if (newQuantity > maxSeatsPerOrder) {
      showToast(
        "warning",
        "Quantity Limit",
        `Cannot select more than ${maxSeatsPerOrder} tickets of this type per order.`
      );
      return;
    }

    // Validation 3: Check against available quantity for this ticket type
    if (newQuantity > ticketTypeCapacity) {
      showToast(
        "warning",
        "Limited Availability",
        `Sorry, only ${ticketTypeCapacity} ${ticketType.name} tickets are available. You cannot select ${newQuantity} tickets.`
      );
      return;
    }

    // Validation 4: Check if total across all ticket types exceeds event capacity
    if (otherTicketsTotal + newQuantity > eventTotalCapacity) {
      showToast(
        "warning",
        "Event Capacity",
        `Cannot select more than ${eventTotalCapacity} tickets total for this event.`
      );
      return;
    }

    // All validations passed - update the quantity
    selectedTickets[ticketId] = newQuantity;
    selectedTickets = { ...selectedTickets }; // Trigger reactivity

    // Show success toast for quantity changes (only if quantity > 0)
    if (newQuantity > 0) {
      showToast(
        "success",
        "Quantity Updated",
        `Selected ${newQuantity} ${ticketType.name} ticket(s).`
      );
    }
  }

  /**
   * Handles adding a single ticket to the selection (increment by 1)
   *
   * Similar validation to handleQuantityChange, but specifically for
   * incrementing by 1. Currently not used in the UI (QuantitySelector
   * handles increments directly), but kept for potential future use.
   *
   * @param ticketId - The ID of the ticket type to add
   */
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

  // ============================================================================
  // FUNCTIONS - Payment Processing
  // ============================================================================

  /**
   * Handles Solana/Web3 payment initiation
   *
   * Currently disabled for maintenance. When enabled, this function:
   * 1. Validates wallet connection
   * 2. Validates ticket selection
   * 3. Calculates payment details
   * 4. Shows confirmation dialog
   * 5. Processes payment via processPayment() after confirmation
   *
   * NOTE: Web3 payments are temporarily disabled - function returns early
   */
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

  /**
   * Processes the confirmed Solana payment
   *
   * Called after user confirms payment in the confirmation dialog.
   * This function:
   * 1. Creates a Solana transaction
   * 2. Sends transaction via wallet
   * 3. Records purchase in database
   * 4. Redirects to confirmation page
   *
   * NOTE: Web3 payments are temporarily disabled - function returns early
   */
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

  /**
   * Handles Orange Money payment initiation
   *
   * Creates a payment code via Monime API and displays the USSD code
   * in a modal for the user to complete payment.
   *
   * Limitations:
   * - Currently limited to 1 ticket per order
   * - Requires Monime API integration
   *
   * Flow:
   * 1. Validate ticket selection
   * 2. Calculate totals and fees
   * 3. Create payment code via Monime API
   * 4. Display payment modal with USSD code
   */
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

    // Limit Orange Money to 1 ticket per order (Monime API limitation)
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

  /**
   * Handles Afrimoney payment initiation
   *
   * Similar to handlePayWithOrangeMoney, but for Afrimoney provider.
   * Creates a payment code via Monime API and displays the USSD code
   * in a modal for the user to complete payment.
   *
   * Limitations:
   * - Currently limited to 1 ticket per order
   * - Requires Monime API integration
   *
   * Flow:
   * 1. Validate ticket selection
   * 2. Calculate totals and fees
   * 3. Create payment code via Monime API
   * 4. Display payment modal with USSD code
   */
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

    // Limit Afrimoney to 1 ticket per order (Monime API limitation)
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

  // ============================================================================
  // FUNCTIONS - Guest Checkout
  // ============================================================================

  /**
   * Opens the guest checkout modal for non-Web3 users
   *
   * Allows users without wallets to purchase tickets using
   * mobile money or card payments.
   */
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

  /**
   * Handles successful guest payment
   *
   * Called when guest checkout completes successfully.
   * Redirects to guest ticket page with access token.
   *
   * @param event - CustomEvent containing accessToken and paymentMethod
   */
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
    // Redirect to guest ticket page with access token
    goto(`/tickets/guest/${accessToken}`);
  }

  /**
   * Handles wallet connection request from guest checkout modal
   *
   * Closes guest checkout modal and prompts user to connect wallet
   * to access Web3 features.
   */
  function handleConnectWalletFromGuest() {
    showGuestCheckout = false;
    // Trigger wallet connection (you can implement this based on your existing wallet connection logic)
    showToast(
      "info",
      "Connect Wallet",
      "Please connect your wallet to access Web3 features."
    );
  }

  // ============================================================================
  // FUNCTIONS - Free Ticket Claiming
  // ============================================================================

  /**
   * Handles claiming free tickets for free events
   *
   * Free tickets require wallet connection to ensure tickets are
   * properly linked to a wallet address for ownership verification.
   *
   * Flow:
   * 1. Validate wallet connection
   * 2. Validate ticket selection and quantities
   * 3. Get/verify Web3 user session
   * 4. Claim tickets via Supabase
   * 5. Redirect to confirmation page
   */
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

  // ============================================================================
  // LIFECYCLE - Component Initialization
  // ============================================================================

  /**
   * Component mount handler
   *
   * Runs when the component is first mounted to the DOM.
   *
   * Responsibilities:
   * 1. Handle URL query parameters (payment cancellation, old session cleanup)
   * 2. Load event data from Supabase
   * 3. Process and format event data
   * 4. Initialize ticket types and event details
   * 5. Set loading states
   */
  onMount(async () => {
    // ========================================================================
    // URL Parameter Handling
    // ========================================================================

    // Check if payment was cancelled (from redirect back from payment gateway)
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

    // ========================================================================
    // Event Data Loading
    // ========================================================================

    try {
      // Load event data from database
      const eventData = await getEventById(eventId);

      if (eventData) {
        // ====================================================================
        // Event Data Processing
        // ====================================================================

        // Determine if event is free based on:
        // 1. Explicit is_free_event flag, OR
        // 2. All ticket types having zero/null/undefined price
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

        // Format event object for display
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

        // ====================================================================
        // Ticket Types Processing
        // ====================================================================

        // Update ticket types from database - always show actual ticket types
        if (eventData.ticket_types && eventData.ticket_types.length > 0) {
          // Map database ticket types to component format
          ticketTypes = eventData.ticket_types.map((ticket: any) => ({
            id: ticket.id,
            name: ticket.name,
            // Handle both string and number price formats
            price:
              typeof ticket.price === "string"
                ? parseFloat(ticket.price)
                : ticket.price,
            description: ticket.description,
            features: ticket.benefits || [],
            // Calculate available quantity: total - sold (minimum 0)
            available_quantity: Math.max(
              0,
              (ticket.quantity || 0) - (ticket.sold_quantity || 0)
            ),
          }));
        } else {
          // Fallback for events without ticket types (shouldn't happen in production)
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

        // ====================================================================
        // Event Details Array for Display
        // ====================================================================

        // Populate event details array for the Key Details section
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

    // Small delay to allow for smooth page load animation
    setTimeout(() => {
      pageLoaded = true;
    }, 100);
  });
</script>

<!-- ============================================================================
     TEMPLATE - Page Structure
     ============================================================================
     
     The page is structured as follows:
     1. Loading/Error states
     2. Navigation buttons (Back, Share)
     3. Hero section with event image and basic info
     4. Two-column layout:
        - Left: Event information (About, Key Details)
        - Right: Ticket selection and payment
     5. Modals (Payment confirmation, Guest checkout, Mobile money payment)
-->

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
    <!-- ======================================================================
         Navigation Buttons
         ====================================================================== -->

    <!-- Back Button - Returns to marketplace -->
    <BackButton
      top="top-20"
      left="left-6"
      link="/marketplace"
      title="Back to Marketplace"
    />

    <!-- Share Button - Share event on social media -->
    <ShareButton
      top="top-20"
      right="right-6"
      url={window.location.href}
      title={event.name}
      description={event.description || "Check out this amazing event!"}
    />

    <!-- ======================================================================
         Hero Section
         ====================================================================== -->

    <!-- Hero Section - Displays event image, name, date, venue -->
    <EventHeroSection {event} />

    <!-- ======================================================================
         Main Content - Two Column Layout
         ====================================================================== -->

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- ==================================================================
             Left Column - Event Information
             ================================================================== -->
        <div class="space-y-8">
          <!-- About the Event - Event description -->
          <EventDetailsCard
            title="About the Event"
            description={event.description ||
              "Experience this amazing event with world-class entertainment and unforgettable moments."}
          />

          <!-- Key Details - Date, time, location, category, organizer, max per order -->
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

        <!-- ==================================================================
             Right Column - Ticket Selection & Payment
             ================================================================== -->
        <div class="space-y-6">
          <!-- Ticket Type Cards - One for each ticket type -->
          {#each ticketTypes as ticket}
            <TicketSelectionCard {ticket}>
              <!-- Sold Out Overlay - Shown when no tickets available -->
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
                </div>
              </div>

              <!-- Quantity Selector - Allows user to select ticket quantity -->
              <div class="flex justify-center">
                <QuantitySelector
                  quantity={selectedTickets[ticket.id] || 0}
                  availableQuantity={ticket.available_quantity}
                  onQuantityChange={(newQuantity) =>
                    handleQuantityChange(ticket.id, newQuantity)}
                />
                <!-- Note: Add to Cart button is commented out - QuantitySelector handles selection directly -->
                <!-- <GradientButton
                  text={ticket.price === 0 ? "Select Quantity" : "Add to Cart"}
                  onClick={() => handleAddToCart(ticket.id)}
                  class_="flex-1"
                  disabled={ticket.available_quantity <= 0}
                /> -->
              </div>
            </TicketSelectionCard>
          {/each}

          <!-- ==================================================================
               Payment Summary Card
               ==================================================================
               
               Displays:
               - Total price
               - Fee breakdown (if applicable)
               - Payment buttons (varies based on event type and wallet connection)
               - Info about max tickets and wallet status
          -->
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
            <!-- Compact Info Section -->
            <div class="mb-4 space-y-2">
              <!-- Max tickets & Wallet status in one row -->
              <div
                class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-400"
              >
                <div class="flex items-center gap-1.5">
                  <svg
                    class="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0"
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
                    >Max {event?.seating_options?.max_seats_per_order || 10} per
                    type</span
                  >
                </div>
                <div class="flex items-center gap-1.5">
                  <div
                    class="h-2 w-2 rounded-full flex-shrink-0 {connectedWalletAddress
                      ? 'bg-green-400'
                      : 'bg-yellow-400'}"
                  ></div>
                  <span>
                    {connectedWalletAddress ? "Wallet Connected" : "No Wallet"}
                  </span>
                </div>
              </div>
            </div>

            <!-- ==============================================================
                 Payment Buttons Section
                 ==============================================================
                 
                 Payment options vary based on:
                 1. Event type (free vs paid)
                 2. Wallet connection status
            -->

            {#if event.is_free_event}
              <!-- Free Event: Show "Get Free Ticket" button -->
              <GradientButton
                text={claimingTickets
                  ? "Claiming Tickets..."
                  : "Get Free Ticket"}
                onClick={handleGetFreeTicket}
                icon={claimingTickets ? "loading" : "ticket"}
                class_="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                disabled={claimingTickets || !connectedWalletAddress}
              />
              {#if !connectedWalletAddress}
                <p class="text-xs text-yellow-400 mt-2 text-center">
                  Wallet connection required to claim free tickets
                </p>
              {/if}
            {:else}
              <!-- Paid Event: Show different buttons based on wallet connection -->
              {#if connectedWalletAddress}
                <!-- Web3 User: Show Solana payment option -->
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
                  class="mt-3 p-2.5 bg-blue-900/20 border border-blue-500/30 rounded-lg"
                >
                  <div class="flex items-center gap-1.5 mb-1">
                    <svg
                      class="w-3.5 h-3.5 text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    <span class="text-xs font-medium text-blue-400"
                      >Web3 Benefits</span
                    >
                  </div>
                  <p class="text-xs text-blue-300">
                    Lower fees • Transferable • Verifiable on blockchain
                  </p>
                </div>
              {:else}
                <!-- Non-Web3 User: Show Mobile Money Payment Options -->
                <div class="space-y-3">
                  <!-- ==========================================================
                       Orange Money Payment Button
                       ==========================================================
                       
                       Features:
                       - Logo-only button (no text)
                       - White background with orange border
                       - Hover effects (scale, shadow, shine)
                       - Loading spinner when processing
                       - Limited to 1 ticket per order
                  -->
                  <button
                    on:click={handlePayWithOrangeMoney}
                    disabled={totalPrice === 0 || processingOrangeMoney}
                    class="relative overflow-hidden w-full px-4 sm:px-6 py-3 sm:py-4 bg-white hover:bg-gray-50 border-2 border-orange-500/30 hover:border-orange-500 rounded-lg font-semibold transition-all duration-300 ease-out transform hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 group/btn flex items-center justify-center"
                  >
                    <!-- Button shine effect on hover -->
                    <div
                      class="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"
                    ></div>
                    <span
                      class="relative z-10 flex items-center justify-center"
                    >
                      {#if processingOrangeMoney}
                        <!-- Loading spinner -->
                        <svg
                          class="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-orange-500"
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
                      {:else}
                        <!-- Orange Money logo -->
                        <img
                          src={orangeMoneyLogo}
                          alt="Orange Money"
                          class="h-6 sm:h-8 w-auto object-contain"
                        />
                      {/if}
                    </span>
                  </button>

                  <!-- ==========================================================
                       Afrimoney Payment Button
                       ==========================================================
                       
                       Features:
                       - Logo-only button (no text)
                       - White background with purple border
                       - Hover effects (scale, shadow, shine)
                       - Loading spinner when processing
                       - Limited to 1 ticket per order
                  -->
                  <button
                    on:click={handlePayWithAfrimoney}
                    disabled={totalPrice === 0 || processingAfrimoney}
                    class="relative overflow-hidden w-full px-4 sm:px-6 py-3 sm:py-4 bg-white hover:bg-gray-50 border-2 border-purple-500/30 hover:border-purple-500 rounded-lg font-semibold transition-all duration-300 ease-out transform hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 group/btn flex items-center justify-center"
                  >
                    <!-- Button shine effect on hover -->
                    <div
                      class="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"
                    ></div>
                    <span
                      class="relative z-10 flex items-center justify-center"
                    >
                      {#if processingAfrimoney}
                        <!-- Loading spinner -->
                        <svg
                          class="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-purple-500"
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
                      {:else}
                        <!-- Afrimoney logo -->
                        <img
                          src={afriMoneyLogo}
                          alt="Afrimoney"
                          class="h-6 sm:h-8 w-auto object-contain"
                        />
                      {/if}
                    </span>
                  </button>

                  <!-- Shared Mobile Money Benefits -->
                  <div
                    class="mt-2 p-2 sm:p-2.5 bg-blue-900/20 border border-blue-500/30 rounded-lg"
                  >
                    <div class="flex items-start gap-1.5">
                      <svg
                        class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                      <div class="flex-1 min-w-0">
                        <p
                          class="text-xs sm:text-sm font-medium text-blue-400 mb-1"
                        >
                          Mobile Money Benefits
                        </p>
                        <p
                          class="text-xs sm:text-sm text-blue-300 leading-relaxed"
                        >
                          Secure mobile payments • No wallet required • Instant
                          confirmation
                        </p>
                        <p
                          class="text-xs sm:text-sm text-blue-200 mt-1 font-medium"
                        >
                          ⚠️ Limited to 1 ticket per order
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Web3 Benefits Callout -->
                <div
                  class="mt-3 p-2.5 bg-purple-900/20 border border-purple-500/30 rounded-lg"
                >
                  <div class="flex items-start gap-1.5">
                    <svg
                      class="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-purple-400 mb-0.5">
                        Want Web3 benefits?
                      </p>
                      <p class="text-xs text-purple-300">
                        Connect wallet for lower fees & transferable tickets
                      </p>
                    </div>
                  </div>
                </div>
              {/if}
            {/if}
          </PaymentSummaryCard>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- ============================================================================
     MODALS
     ============================================================================ -->

<!-- Payment Confirmation Dialog
     Shown before processing Solana payment to confirm transaction details -->
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

<!-- Guest Checkout Modal
     Allows non-Web3 users to purchase tickets with mobile money or card -->
<GuestCheckoutModal
  bind:show={showGuestCheckout}
  totalAmount={totalPrice}
  eventName={event?.name || "Event"}
  on:success={handleGuestPaymentSuccess}
  on:connectWallet={handleConnectWalletFromGuest}
  on:close={() => (showGuestCheckout = false)}
/>

<!-- Mobile Money Payment Modal
     Displays USSD code for Orange Money or Afrimoney payment
     Polls payment status and redirects on success -->
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
      // Redirect to confirmation page on successful payment
      goto(`/tickets/confirmation/${orderId}`);
      showPaymentModal = false;
      paymentModalData = null;
    }}
  />
{/if}

<!-- ============================================================================
     STYLES
     ============================================================================ -->

<style>
  /* Page load animation - smooth transitions for all properties */
  .transition-all {
    transition-property: all;
  }
</style>
