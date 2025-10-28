<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { processOrangeMoneyCallback } from "$lib/orangeMoneyPayment.js";
  import { showToast } from "$lib/store.js";

  let loading = true;
  let success = false;
  let error = "";
  let orderId = "";
  let paymentMethod = "orange_money";

  // Parse URL parameters immediately to avoid flash of wrong provider
  const urlParams = new URLSearchParams($page.url.search);
  paymentMethod = urlParams.get("payment_method") || "orange_money";

  // Computed values based on payment method
  $: isOrangeMoney = paymentMethod === "orange_money";
  $: isAfrimoney = paymentMethod === "afrimoney";
  $: providerName = isOrangeMoney ? "Orange Money" : "Afrimoney";
  $: providerColor = isOrangeMoney ? "orange" : "green";
  $: providerGradient = isOrangeMoney
    ? "from-orange-500 to-orange-600"
    : "from-green-500 to-green-600";
  $: providerBg = isOrangeMoney
    ? "from-orange-50 to-orange-100"
    : "from-green-50 to-green-100";

  onMount(async () => {
    // Support both old and new URL parameter formats
    const eventId = urlParams.get("e") || urlParams.get("event_id");
    const sessionId = urlParams.get("s") || urlParams.get("session_id");
    const buyerNameParam = urlParams.get("n") || urlParams.get("buyer_name");
    const buyerWalletParam =
      urlParams.get("w") || urlParams.get("buyer_wallet");
    const selectedTicketsParam = urlParams.get("selected_tickets");
    const ticketDetailsParam = urlParams.get("ticket_details");

    if (!eventId || !sessionId) {
      error = "Missing payment information";
      loading = false;
      return;
    }

    try {
      // For now, we'll simulate the callback processing
      // In a real implementation, you'd get the purchase data from the session
      // or pass it through the URL parameters

      // This is a placeholder - you'll need to implement session storage
      // Get purchase data from the checkout session metadata
      const { monimeService } = await import("$lib/monime.js");
      const paymentStatus = await monimeService.getPaymentStatus(sessionId);

      // Extract purchase data from session metadata
      const metadata = (paymentStatus as any).metadata || {};

      // Get purchase data from Monime metadata (URL params are now minimal)
      const purchaseData = {
        eventId: eventId,
        selectedTickets: {}, // Will be reconstructed from metadata
        totalAmount: paymentStatus.amount || 0,
        ticketDetails: [], // Will be reconstructed from metadata
        buyerInfo: {
          name: buyerNameParam
            ? decodeURIComponent(buyerNameParam)
            : metadata.buyer_name || "Guest User",
          wallet_address: buyerWalletParam
            ? decodeURIComponent(buyerWalletParam)
            : metadata.buyer_wallet || undefined,
        },
      };

      // Reconstruct ticket data from metadata
      // Since we can't pass full ticket details in URL, we'll fetch from checkout session
      // The checkout session has the line items which tell us what was purchased
      if (paymentStatus.lineItems?.data) {
        const ticketLineItems = paymentStatus.lineItems.data.filter(
          (item: any) => item.reference !== "platform_fee"
        );

        // Reconstruct ticket details
        purchaseData.ticketDetails = ticketLineItems.map((item: any) => ({
          id: item.reference || "",
          name: item.name,
          price: item.price.value / 100, // Convert from cents back to SLE
          quantity: item.quantity,
        }));

        // Reconstruct selected tickets object
        purchaseData.selectedTickets = {};
        ticketLineItems.forEach((item: any) => {
          if (item.reference) {
            purchaseData.selectedTickets[item.reference] = item.quantity;
          }
        });

        // Update total amount (convert from cents)
        purchaseData.totalAmount = parseFloat(
          (paymentStatus.amount || 0) / 100
        );
      } else if (metadata.total_amount) {
        // Fallback: use metadata values
        purchaseData.totalAmount = parseFloat(metadata.total_amount || "0");
      }

      const result = await processOrangeMoneyCallback(
        sessionId,
        purchaseData,
        paymentMethod
      );

      if (result.success) {
        success = true;
        orderId = result.orderId || "";

        showToast(
          "success",
          "Payment Successful",
          "Your tickets have been purchased successfully!"
        );
      } else {
        error = result.error || "Payment processing failed";
        showToast("error", "Payment Failed", error);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error occurred";
      showToast("error", "Payment Error", error);
    } finally {
      loading = false;
    }
  });

  function goToTickets() {
    if (orderId) {
      goto(`/tickets/confirmation/${orderId}`);
    } else {
      goto("/marketplace");
    }
  }
</script>

<svelte:head>
  <title>{providerName} Payment Success - SOS SEATS</title>
</svelte:head>

<div
  class="min-h-screen bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] flex items-center justify-center p-4"
>
  <div class="max-w-md w-full">
    <div
      class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center"
    >
      {#if loading}
        <div class="mb-6">
          <div
            class="w-16 h-16 mx-auto mb-4 border-4 border-[#00F5FF] border-t-transparent rounded-full animate-spin"
          ></div>
          <h2 class="text-2xl font-bold text-white mb-2">Processing Payment</h2>
          <p class="text-gray-300">
            Please wait while we confirm your {providerName} payment...
          </p>
        </div>
      {:else if success}
        <div class="mb-6">
          <div
            class="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">
            Payment Successful!
          </h2>
          <p class="text-gray-300 mb-4">
            Your {providerName} payment has been processed successfully.
          </p>
          {#if orderId}
            <p class="text-sm text-gray-400 mb-4">Order ID: {orderId}</p>
          {/if}
        </div>

        <button
          on:click={goToTickets}
          class="w-full bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] text-white font-semibold py-3 px-6 rounded-lg hover:from-[#00D4E6] hover:to-[#8B3DD6] transition-all duration-300 transform hover:scale-105"
        >
          View Your Tickets
        </button>
      {:else}
        <div class="mb-6">
          <div
            class="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">Payment Failed</h2>
          <p class="text-gray-300 mb-4">{error}</p>
        </div>

        <div class="space-y-3">
          <button
            on:click={() => goto("/marketplace")}
            class="w-full bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] text-white font-semibold py-3 px-6 rounded-lg hover:from-[#00D4E6] hover:to-[#8B3DD6] transition-all duration-300 transform hover:scale-105"
          >
            Browse Events
          </button>
          <button
            on:click={() => window.history.back()}
            class="w-full bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
