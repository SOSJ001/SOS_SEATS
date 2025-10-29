<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { monimeService } from "$lib/monime.js";
  import { processOrangeMoneyCallback } from "$lib/orangeMoneyPayment.js";
  import { showToast } from "$lib/store.js";
  import ConfirmationDialog from "$lib/components/ConfirmationDialog.svelte";

  export let show = false;
  export let paymentCodeId: string = "";
  export let ussdCode: string = "";
  export let amount: number = 0;
  export let currency: string = "SLE";
  export let paymentMethod: "orange_money" | "afrimoney" = "orange_money";
  export let purchaseData: any = null;

  const dispatch = createEventDispatcher();

  let paymentStatus = "pending";
  let pollingInterval: ReturnType<typeof setInterval> | null = null;
  let timeRemaining = 30 * 60; // 30 minutes in seconds
  let timeInterval: ReturnType<typeof setInterval> | null = null;
  let showCloseConfirmation = false;
  let cancelingCode = false;
  let isProcessingPayment = false; // Prevent duplicate payment processing

  const providerName =
    paymentMethod === "orange_money" ? "Orange Money" : "Afrimoney";
  const providerColor = paymentMethod === "orange_money" ? "orange" : "green";

  function requestCloseModal() {
    // Show confirmation dialog before closing
    if (paymentStatus === "pending") {
      showCloseConfirmation = true;
    } else {
      // If completed/expired, close without confirmation
      closeModal();
    }
  }

  async function closeModal() {
    // Stop polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    if (timeInterval) {
      clearInterval(timeInterval);
      timeInterval = null;
    }

    // Cancel payment code if still pending (only if not used)
    if (paymentStatus === "pending" && paymentCodeId) {
      cancelingCode = true;
      try {
        await monimeService.cancelPaymentCode(paymentCodeId);
      } catch (error) {
        // Silent fail - code might already be used or expired
      }
      cancelingCode = false;
    }

    show = false;
    showCloseConfirmation = false;
    dispatch("close");
  }

  function handleCloseConfirm() {
    showCloseConfirmation = false;
    closeModal();
  }

  function handleCloseCancel() {
    showCloseConfirmation = false;
  }

  function handleBackdropClick(event: MouseEvent) {
    // Disabled: Don't close modal on backdrop click
    event.stopPropagation();
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  async function checkPaymentStatus() {
    if (!paymentCodeId || paymentStatus !== "pending" || isProcessingPayment)
      return;

    try {
      const status = await monimeService.getPaymentCodeStatus(paymentCodeId);

      // Check if payment is completed (with or without processedPaymentData)
      if (status.status === "completed") {
        // Prevent duplicate processing - check if already processing
        if (isProcessingPayment) return;

        // Set flag to prevent duplicate processing
        isProcessingPayment = true;

        // Stop polling once we detect completion
        paymentStatus = "completed";

        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        if (timeInterval) {
          clearInterval(timeInterval);
          timeInterval = null;
        }

        // Extract purchase data from stored data or metadata
        let ticketDetails = purchaseData?.ticketDetails || [];
        let selectedTickets = purchaseData?.selectedTickets || {};
        let paymentAmount = amount;

        // If metadata has ticket details, use those
        if (status.metadata) {
          try {
            if (status.metadata.ticket_details) {
              ticketDetails = JSON.parse(status.metadata.ticket_details);
            }
            if (status.metadata.selected_tickets) {
              selectedTickets = JSON.parse(status.metadata.selected_tickets);
            }
          } catch (e) {
            console.error("Failed to parse metadata:", e);
          }
        }

        // Try to get amount from processedPaymentData if available, otherwise use stored amount
        if (status.processedPaymentData?.amount?.value) {
          paymentAmount = status.processedPaymentData.amount.value / 100;
        }

        // Use payment ID from processedPaymentData if available, otherwise use payment code ID
        const paymentId =
          status.processedPaymentData?.paymentId || paymentCodeId;

        // Process callback - create order using payment code ID as transaction reference
        // Skip status check for payment codes since we already confirmed it's completed
        const result = await processOrangeMoneyCallback(
          paymentId,
          {
            eventId: purchaseData?.eventId || "",
            selectedTickets,
            totalAmount: paymentAmount,
            ticketDetails,
            buyerInfo: purchaseData?.buyerInfo || { name: "Guest User" },
          },
          paymentMethod,
          true // Skip status check - payment code is already confirmed as completed
        );

        if (result.success) {
          showToast(
            "success",
            "Payment Successful!",
            "Your tickets have been purchased successfully."
          );
          setTimeout(() => {
            closeModal();
            dispatch("success", { orderId: result.orderId });
          }, 2000);
        } else {
          // Reset processing flag on error so user can retry
          isProcessingPayment = false;
          paymentStatus = "error";
          showToast(
            "error",
            "Payment Error",
            result.error || "Failed to process payment"
          );
        }
      } else if (
        status.status === "cancelled" ||
        status.status === "expired" ||
        status.status === "failed"
      ) {
        paymentStatus = status.status;
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        if (timeInterval) {
          clearInterval(timeInterval);
          timeInterval = null;
        }

        if (status.status === "failed") {
          showToast(
            "error",
            "Payment Failed",
            "The payment could not be processed. Please try again."
          );
        }
      } else if (status.status === "processing") {
        // Payment is being processed - keep polling
      }
    } catch (error) {
      console.error("Payment status check error:", error);
      // Don't stop polling on error, might be temporary network issue
    }
  }

  onMount(() => {
    if (show && paymentCodeId) {
      // Start polling for payment status every 3 seconds
      pollingInterval = setInterval(checkPaymentStatus, 3000);

      // Start countdown timer
      timeInterval = setInterval(() => {
        if (timeRemaining > 0) {
          timeRemaining--;
        } else {
          if (timeInterval) {
            clearInterval(timeInterval);
            timeInterval = null;
          }
          if (paymentStatus === "pending") {
            paymentStatus = "expired";
          }
        }
      }, 1000);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (timeInterval) {
        clearInterval(timeInterval);
      }
    };
  });

  onDestroy(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    if (timeInterval) {
      clearInterval(timeInterval);
    }
  });
</script>

{#if show}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    on:click={handleBackdropClick}
    on:keydown={(e) =>
      e.key === "Escape" && paymentStatus === "pending" && closeModal()}
    role="button"
    tabindex="-1"
    aria-label="Close modal"
    transition:fade={{ duration: 200 }}
  >
    <!-- Modal Content -->
    <div
      class="relative w-full max-w-md my-auto"
      transition:scale={{ duration: 200, start: 0.95 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <!-- Background gradient -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] rounded-xl border border-[#00F5FF]/20"
      ></div>

      <!-- Close button (only show when pending) -->
      {#if paymentStatus === "pending"}
        <button
          on:click={requestCloseModal}
          class="absolute top-4 right-4 z-20 w-8 h-8 bg-gray-800/50 hover:bg-gray-700/70 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 group"
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
      {/if}

      <!-- Main content -->
      <div class="relative z-10 p-6 max-h-[90vh] overflow-y-auto">
        {#if paymentStatus === "pending"}
          <!-- Pending Payment -->
          <div class="text-center">
            <div class="mb-4">
              <div
                class="inline-flex items-center justify-center w-16 h-16 rounded-full {paymentMethod ===
                'orange_money'
                  ? 'bg-orange-500/20'
                  : 'bg-green-500/20'} mb-4"
              >
                <svg
                  class="w-8 h-8 {paymentMethod === 'orange_money'
                    ? 'text-orange-400'
                    : 'text-green-400'}"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            <h2 class="text-2xl font-bold text-white mb-2">
              Pay with {providerName}
            </h2>
            <p class="text-gray-400 mb-6">
              Dial the USSD code below on your mobile phone to complete the
              payment
            </p>

            <!-- USSD Code Display -->
            <div
              class="bg-gray-800/50 border-2 {paymentMethod === 'orange_money'
                ? 'border-orange-500/50'
                : 'border-green-500/50'} rounded-lg p-6 mb-6"
            >
              <div class="text-sm text-gray-400 mb-2">USSD Code:</div>
              <div
                class="text-3xl font-mono font-bold {paymentMethod ===
                'orange_money'
                  ? 'text-orange-400'
                  : 'text-green-400'} break-all"
              >
                {ussdCode}
              </div>
              <button
                on:click={() => {
                  navigator.clipboard.writeText(ussdCode);
                  showToast(
                    "success",
                    "Copied!",
                    "USSD code copied to clipboard"
                  );
                }}
                class="mt-4 text-sm {paymentMethod === 'orange_money'
                  ? 'text-orange-400 hover:text-orange-300'
                  : 'text-green-400 hover:text-green-300'} underline"
              >
                Copy Code
              </button>
            </div>

            <!-- Amount and Timer -->
            <div class="space-y-4 mb-6">
              <div class="flex justify-between items-center text-gray-300">
                <span>Amount:</span>
                <span class="text-xl font-bold text-white"
                  >{currency} {amount.toFixed(2)}</span
                >
              </div>
              <div class="flex justify-between items-center text-gray-300">
                <span>Time Remaining:</span>
                <span
                  class="text-lg font-semibold {paymentMethod === 'orange_money'
                    ? 'text-orange-400'
                    : 'text-green-400'}">{formatTime(timeRemaining)}</span
                >
              </div>
            </div>

            <!-- Instructions -->
            <div
              class="bg-gray-900/50 rounded-lg p-4 text-left text-sm text-gray-400"
            >
              <div class="font-semibold text-gray-300 mb-2">Instructions:</div>
              <ol class="list-decimal list-inside space-y-1">
                <li>Dial the USSD code shown above on your mobile phone</li>
                <li>Follow the prompts to confirm payment</li>
                <li>
                  Wait for payment confirmation (this page will update
                  automatically)
                </li>
              </ol>
            </div>

            <!-- Loading indicator -->
            <div
              class="mt-6 flex items-center justify-center space-x-2 text-gray-400"
            >
              <svg
                class="animate-spin h-5 w-5"
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
              <span>Waiting for payment confirmation...</span>
            </div>
          </div>
        {:else if paymentStatus === "completed"}
          <!-- Payment Completed -->
          <div class="text-center">
            <div class="mb-4">
              <div
                class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4"
              >
                <svg
                  class="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">
              Payment Successful!
            </h2>
            <p class="text-gray-400">
              Your payment has been confirmed. Processing your tickets...
            </p>
          </div>
        {:else if paymentStatus === "expired"}
          <!-- Payment Expired -->
          <div class="text-center">
            <div class="mb-4">
              <div
                class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4"
              >
                <svg
                  class="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">Payment Expired</h2>
            <p class="text-gray-400 mb-6">
              This payment code has expired. Please try again.
            </p>
            <button
              on:click={closeModal}
              class="px-6 py-2 bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] text-white rounded-lg font-medium hover:scale-105 transition-all"
            >
              Close
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Close Confirmation Dialog -->
<ConfirmationDialog
  bind:show={showCloseConfirmation}
  title="Cancel Payment?"
  message="Are you sure you want to cancel this payment? The USSD code will be invalidated and you won't be able to complete the payment."
  confirmText={cancelingCode ? "Canceling..." : "Yes, Cancel Payment"}
  cancelText="Continue Payment"
  confirmVariant="danger"
  loading={cancelingCode}
  on:confirm={handleCloseConfirm}
  on:cancel={handleCloseCancel}
/>
