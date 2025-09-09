<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade, scale } from "svelte/transition";

  export let show = false;
  export let totalAmount = 0;
  export let eventName = "";

  const dispatch = createEventDispatcher();

  // Payment method selection
  let selectedPaymentMethod = "card"; // "card" or "orange_money"

  // Card payment fields
  let cardNumber = "";
  let expiryDate = "";
  let cvv = "";
  let cardholderName = "";

  // Orange Money fields
  let orangeMoneyNumber = "";
  let orangeMoneyPin = "";

  let error = "";
  let isProcessing = false;

  function handleSubmit() {
    error = "";

    if (selectedPaymentMethod === "card") {
      // Validate card payment
      if (!cardNumber || !expiryDate || !cvv) {
        error = "Please fill in all card payment details";
        return;
      }

      if (cardNumber.length < 16) {
        error = "Please enter a valid card number";
        return;
      }

      if (expiryDate.length < 5) {
        error = "Please enter a valid expiry date (MM/YY)";
        return;
      }

      if (cvv.length < 3) {
        error = "Please enter a valid CVV";
        return;
      }
    } else if (selectedPaymentMethod === "orange_money") {
      // Validate Orange Money payment
      if (!orangeMoneyNumber || !orangeMoneyPin) {
        error = "Please fill in all Orange Money details";
        return;
      }

      if (orangeMoneyNumber.length < 9) {
        error = "Please enter a valid Orange Money number";
        return;
      }

      if (orangeMoneyPin.length < 4) {
        error = "Please enter a valid PIN";
        return;
      }
    }

    isProcessing = true;

    // Simulate payment processing
    setTimeout(() => {
      const accessToken = generateAccessToken();
      const paymentHash =
        selectedPaymentMethod === "card"
          ? `pi_${Date.now()}`
          : `om_${Date.now()}`;
      dispatch("success", {
        accessToken,
        paymentHash,
        paymentMethod: selectedPaymentMethod,
      });
      isProcessing = false;
    }, 2000);
  }

  function handleClose() {
    if (!isProcessing) {
      show = false;
      resetForm();
      dispatch("close");
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && !isProcessing) {
      handleClose();
    }
  }

  function resetForm() {
    selectedPaymentMethod = "card";
    cardNumber = "";
    expiryDate = "";
    cvv = "";
    cardholderName = "";
    orangeMoneyNumber = "";
    orangeMoneyPin = "";
    error = "";
    isProcessing = false;
  }

  function generateAccessToken() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  // Reset form when modal opens
  $: if (show) {
    resetForm();
  }
</script>

{#if show}
  <div
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === "Escape" && handleClose()}
    aria-label="Close modal"
    role="dialog"
    aria-modal="true"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="relative w-full max-w-md my-8"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      <div
        class="absolute inset-0 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] rounded-xl border border-[#00F5FF]/20"
      ></div>

      <button
        on:click={handleClose}
        disabled={isProcessing}
        class="absolute top-4 right-4 z-20 w-8 h-8 bg-gray-800/50 hover:bg-gray-700/70 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 group disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div class="relative z-10 p-6 max-h-[80vh] overflow-y-auto modal-scroll">
        <h3
          class="text-2xl font-bold mb-2 bg-gradient-to-r from-[#00F5FF] via-[#9D4EDD] to-[#FF6B6B] bg-clip-text text-transparent drop-shadow-lg"
        >
          💳 Guest Checkout
        </h3>

        <p class="text-gray-300 text-sm mb-6">
          Complete your purchase without creating an account. Your tickets will
          be delivered instantly.
        </p>

        <!-- Event Summary -->
        <div
          class="mb-6 p-4 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#00F5FF]/30 rounded-lg"
        >
          <div class="text-sm text-gray-400 mb-1">Event</div>
          <div class="text-white font-semibold">{eventName}</div>
          <div class="text-sm text-gray-300 mt-1">Total: ${totalAmount}</div>
        </div>

        <!-- Payment Method Selection -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold text-white mb-4">
            Choose Payment Method
          </h4>
          <div class="grid grid-cols-1 gap-3">
            <!-- Card Payment Option -->
            <button
              type="button"
              on:click={() => (selectedPaymentMethod = "card")}
              class="p-4 rounded-lg border-2 transition-all duration-200 {selectedPaymentMethod ===
              'card'
                ? 'border-[#00F5FF] bg-[#00F5FF]/10'
                : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'}"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    ></path>
                  </svg>
                </div>
                <div class="flex-1 text-left">
                  <div class="font-semibold text-white">Credit/Debit Card</div>
                  <div class="text-sm text-gray-400">
                    Visa, Mastercard, American Express
                  </div>
                </div>
                <div
                  class="w-5 h-5 rounded-full border-2 {selectedPaymentMethod ===
                  'card'
                    ? 'border-[#00F5FF] bg-[#00F5FF]'
                    : 'border-gray-500'} flex items-center justify-center"
                >
                  {#if selectedPaymentMethod === "card"}
                    <div class="w-2 h-2 rounded-full bg-white"></div>
                  {/if}
                </div>
              </div>
            </button>

            <!-- Orange Money Option -->
            <button
              type="button"
              on:click={() => (selectedPaymentMethod = "orange_money")}
              class="p-4 rounded-lg border-2 transition-all duration-200 {selectedPaymentMethod ===
              'orange_money'
                ? 'border-[#FF6B6B] bg-[#FF6B6B]/10'
                : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'}"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                    />
                  </svg>
                </div>
                <div class="flex-1 text-left">
                  <div class="font-semibold text-white">Orange Money SL</div>
                  <div class="text-sm text-gray-400">Mobile money payment</div>
                </div>
                <div
                  class="w-5 h-5 rounded-full border-2 {selectedPaymentMethod ===
                  'orange_money'
                    ? 'border-[#FF6B6B] bg-[#FF6B6B]'
                    : 'border-gray-500'} flex items-center justify-center"
                >
                  {#if selectedPaymentMethod === "orange_money"}
                    <div class="w-2 h-2 rounded-full bg-white"></div>
                  {/if}
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Payment Form -->
        <div class="space-y-4">
          {#if selectedPaymentMethod === "card"}
            <!-- Card Payment Fields -->
            <!-- Card Number -->
            <div>
              <label
                for="cardNumber"
                class="block text-sm font-medium text-gray-300 mb-2"
              >
                Card Number <span class="text-red-400">*</span>
              </label>
              <input
                id="cardNumber"
                type="text"
                bind:value={cardNumber}
                disabled={isProcessing}
                placeholder="1234 5678 9012 3456"
                maxlength="19"
                class="w-full px-4 py-3 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#00F5FF]/30 rounded-lg text-white placeholder-gray-400 focus:border-[#00F5FF]/60 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <!-- Expiry and CVV -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  for="expiryDate"
                  class="block text-sm font-medium text-gray-300 mb-2"
                >
                  Expiry Date <span class="text-red-400">*</span>
                </label>
                <input
                  id="expiryDate"
                  type="text"
                  bind:value={expiryDate}
                  disabled={isProcessing}
                  placeholder="MM/YY"
                  maxlength="5"
                  class="w-full px-4 py-3 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#00F5FF]/30 rounded-lg text-white placeholder-gray-400 focus:border-[#00F5FF]/60 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label
                  for="cvv"
                  class="block text-sm font-medium text-gray-300 mb-2"
                >
                  CVV <span class="text-red-400">*</span>
                </label>
                <input
                  id="cvv"
                  type="text"
                  bind:value={cvv}
                  disabled={isProcessing}
                  placeholder="123"
                  maxlength="4"
                  class="w-full px-4 py-3 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#00F5FF]/30 rounded-lg text-white placeholder-gray-400 focus:border-[#00F5FF]/60 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <!-- Cardholder Name -->
            <div>
              <label
                for="cardholderName"
                class="block text-sm font-medium text-gray-300 mb-2"
              >
                Cardholder Name
              </label>
              <input
                id="cardholderName"
                type="text"
                bind:value={cardholderName}
                disabled={isProcessing}
                placeholder="John Doe"
                class="w-full px-4 py-3 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#00F5FF]/30 rounded-lg text-white placeholder-gray-400 focus:border-[#00F5FF]/60 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          {:else if selectedPaymentMethod === "orange_money"}
            <!-- Orange Money Payment Fields -->
            <div>
              <label
                for="orangeMoneyNumber"
                class="block text-sm font-medium text-gray-300 mb-2"
              >
                Orange Money Number <span class="text-red-400">*</span>
              </label>
              <input
                id="orangeMoneyNumber"
                type="tel"
                bind:value={orangeMoneyNumber}
                disabled={isProcessing}
                placeholder="+232 XX XXX XXX"
                maxlength="15"
                class="w-full px-4 py-3 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#FF6B6B]/30 rounded-lg text-white placeholder-gray-400 focus:border-[#FF6B6B]/60 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div class="text-xs text-gray-400 mt-1">
                Enter your Orange Money mobile number
              </div>
            </div>

            <div>
              <label
                for="orangeMoneyPin"
                class="block text-sm font-medium text-gray-300 mb-2"
              >
                PIN <span class="text-red-400">*</span>
              </label>
              <input
                id="orangeMoneyPin"
                type="password"
                bind:value={orangeMoneyPin}
                disabled={isProcessing}
                placeholder="Enter your PIN"
                maxlength="6"
                class="w-full px-4 py-3 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#FF6B6B]/30 rounded-lg text-white placeholder-gray-400 focus:border-[#FF6B6B]/60 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div class="text-xs text-gray-400 mt-1">
                Your Orange Money transaction PIN
              </div>
            </div>

            <!-- Orange Money Info -->
            <div
              class="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg"
            >
              <div class="flex items-center gap-2 mb-2">
                <svg
                  class="w-5 h-5 text-orange-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span class="text-sm font-semibold text-orange-400"
                  >Orange Money Payment</span
                >
              </div>
              <p class="text-xs text-orange-300">
                You will receive a confirmation SMS from Orange Money. Make sure
                you have sufficient balance in your Orange Money account.
              </p>
            </div>
          {/if}

          <!-- Error Message -->
          {#if error}
            <div class="p-3 bg-red-900/50 border border-red-500/30 rounded-lg">
              <div class="text-sm text-red-400">
                {error}
              </div>
            </div>
          {/if}

          <!-- Web3 Upsell -->
          <div
            class="p-4 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#9D4EDD]/30 rounded-lg"
          >
            <div class="flex items-center gap-2 mb-2">
              <svg
                class="w-5 h-5 text-[#9D4EDD]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span class="text-sm font-semibold text-[#9D4EDD]"
                >Want Web3 benefits?</span
              >
            </div>
            <p class="text-xs text-gray-400">
              Connect your wallet for lower fees, transferable tickets, and true
              ownership.
            </p>
            <button
              on:click={() => dispatch("connectWallet")}
              class="mt-2 text-xs text-[#00F5FF] hover:text-[#00F5FF]/80 transition-colors duration-200"
            >
              Connect Wallet →
            </button>
          </div>

          <!-- Privacy Notice -->
          <div
            class="p-3 bg-green-900/20 border border-green-500/30 rounded-lg"
          >
            <div class="flex items-center gap-2 mb-1">
              <svg
                class="w-4 h-4 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span class="text-xs font-semibold text-green-400"
                >Privacy Protected</span
              >
            </div>
            <p class="text-xs text-green-300">
              We don't store your personal information. Your payment is
              processed securely.
            </p>
          </div>

          <!-- Submit Button -->
          <button
            on:click={handleSubmit}
            disabled={isProcessing ||
              (selectedPaymentMethod === "card" &&
                (!cardNumber || !expiryDate || !cvv)) ||
              (selectedPaymentMethod === "orange_money" &&
                (!orangeMoneyNumber || !orangeMoneyPin))}
            class="w-full py-3 px-6 {selectedPaymentMethod === 'card'
              ? 'bg-gradient-to-r from-[#00F5FF] via-[#9D4EDD] to-[#FF6B6B] hover:from-[#00F5FF]/90 hover:via-[#9D4EDD]/90 hover:to-[#FF6B6B]/90'
              : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'} text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {#if isProcessing}
              <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
              Processing Payment...
            {:else if selectedPaymentMethod === "card"}
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                ></path>
              </svg>
              Pay ${totalAmount} with Card
            {:else}
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
              Pay ${totalAmount} with Orange Money
            {/if}
          </button>

          <!-- Cancel Button -->
          <button
            on:click={handleClose}
            disabled={isProcessing}
            class="w-full py-2 px-6 text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-scroll {
    scrollbar-width: thin;
    scrollbar-color: #4b5563 #1f2937;
  }

  .modal-scroll::-webkit-scrollbar {
    width: 6px;
  }

  .modal-scroll::-webkit-scrollbar-track {
    background: #1f2937;
    border-radius: 3px;
  }

  .modal-scroll::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
  }

  .modal-scroll::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style>
