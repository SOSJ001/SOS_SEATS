<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  let loading = true;
  let sessionId = "";
  let amount = 0;
  let currency = "SLE";

  onMount(() => {
    const urlParams = new URLSearchParams($page.url.search);
    sessionId = urlParams.get("mock_session_id") || "";
    const amountParam = urlParams.get("amount") || "0";
    amount = parseFloat(amountParam) || 0;
    currency = urlParams.get("currency") || "SLE";

    // Simulate loading time
    setTimeout(() => {
      loading = false;
    }, 2000);
  });

  function simulatePayment() {
    // Simulate successful payment
    const successUrl = `/payment/orange-money/success?event_id=${$page.url.searchParams.get("event_id")}&session_id=${sessionId}`;
    goto(successUrl);
  }

  function cancelPayment() {
    const eventId = $page.url.searchParams.get("event_id");
    goto(`/marketplace/eventDetails/${eventId}?payment=cancelled`);
  }
</script>

<svelte:head>
  <title>Mock Orange Money Checkout - SOS SEATS</title>
</svelte:head>

<div
  class="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4"
>
  <div class="max-w-md w-full">
    <div class="bg-white rounded-2xl shadow-xl p-8">
      {#if loading}
        <div class="text-center">
          <div
            class="w-16 h-16 mx-auto mb-4 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"
          ></div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">
            Loading Orange Money
          </h2>
          <p class="text-gray-600">Setting up your payment...</p>
        </div>
      {:else}
        <div class="text-center">
          <!-- Orange Money Logo -->
          <div
            class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-10 h-10 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              />
            </svg>
          </div>

          <h2 class="text-2xl font-bold text-gray-800 mb-2">
            Orange Money Payment
          </h2>
          <p class="text-gray-600 mb-6">Complete your payment securely</p>

          <!-- Payment Details -->
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <div class="flex justify-between items-center mb-2">
              <span class="text-gray-600">Amount:</span>
              <span class="font-semibold text-gray-800"
                >{currency}
                {amount > 0 ? amount.toLocaleString() : "50,000"}</span
              >
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Session ID:</span>
              <span class="text-sm text-gray-500 font-mono">{sessionId}</span>
            </div>
          </div>

          <!-- Mock Payment Form -->
          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Orange Money Number</label
              >
              <input
                type="tel"
                placeholder="+232 XX XXX XXX"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value="+232 76 123 456"
                readonly
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >PIN</label
              >
              <input
                type="password"
                placeholder="Enter PIN"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value="1234"
                readonly
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-3">
            <button
              on:click={simulatePayment}
              class="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
            >
              Pay {currency}
              {amount > 0 ? amount.toLocaleString() : "50,000"}
            </button>
            <button
              on:click={cancelPayment}
              class="w-full bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all duration-300"
            >
              Cancel Payment
            </button>
          </div>

          <!-- Test Mode Notice -->
          <div
            class="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div class="flex items-center gap-2">
              <svg
                class="w-5 h-5 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              <span class="text-sm text-yellow-800 font-medium">Test Mode</span>
            </div>
            <p class="text-xs text-yellow-700 mt-1">
              This is a mock Orange Money checkout for testing. No real payment
              will be processed.
            </p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
