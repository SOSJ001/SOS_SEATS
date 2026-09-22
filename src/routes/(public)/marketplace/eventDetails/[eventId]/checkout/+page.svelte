<script>
  // @ts-nocheck
  /**
   * Marketplace paid MM checkout — desktop 55:450 / mobile 4:407.
   * Pending state uses HI-FI 55:521 CheckoutPendingLayout.
   */
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import {
    handleMobileMoneyPaymentWithCode,
  } from "$lib/orangeMoneyPayment";
  import { monimeService } from "$lib/monime";
  import { calculateBookingFee } from "$lib/fees";
  import { walletStore, web3UserStore, showToast } from "$lib/store";
  import AuthPanelDecor from "$lib/components/auth/AuthPanelDecor.svelte";
  import CheckoutEventHero from "$lib/components/checkout/CheckoutEventHero.svelte";
  import CheckoutPendingLayout from "$lib/components/checkout/CheckoutPendingLayout.svelte";
  import MarketplaceCheckoutFailedLayout from "$lib/components/checkout/MarketplaceCheckoutFailedLayout.svelte";
  import MarketplaceCheckoutCard from "$lib/components/public/MarketplaceCheckoutCard.svelte";

  const STORAGE_KEY = "sos_mm_checkout";
  const ORDER_WAIT_MAX_MS = 90_000;
  const ORDER_WAIT_INTERVAL_MS = 2000;

  export let data;

  $: eventId = $page.params.eventId;
  $: event = data?.event || null;
  $: ticketTypes = data?.ticketTypes || [];

  let selectedTickets = {};
  let ready = false;
  let paymentMethod = "orange_money";
  let phone = "";
  let fullName = "";
  let creating = false;

  /** @type {null | {
   *   paymentCodeId: string,
   *   ussdCode: string,
   *   amount: number,
   *   paymentMethod: string,
   *   purchaseData: object
   * }} */
  let pendingPayment = null;
  /** @type {null | { amountLabel: string, reason: string, orderId: string }} */
  let failedPayment = null;
  let paymentStatus = "idle"; // idle | pending | completed | error | expired | failed
  let isProcessingPayment = false;
  let cancelingPayment = false;
  /** Seconds left on the payment code (Monime duration: 30m). */
  let timeRemaining = 0;
  /** @type {ReturnType<typeof setInterval> | null} */
  let pollingInterval = null;
  /** @type {ReturnType<typeof setInterval> | null} */
  let timeInterval = null;

  const PAYMENT_CODE_TTL_SECONDS = 30 * 60;

  $: connectedWalletAddress = $walletStore?.address || null;
  $: web3User = $web3UserStore?.user || null;

  $: heroDateTime = formatHeroDateTime(event?.dateRaw, event?.time);
  $: heroVenue = (event?.location || event?.venue || "").trim();
  $: orderRef = deriveOrderRef(event?.name, eventId);

  $: carrierLabel =
    pendingPayment?.paymentMethod === "afrimoney"
      ? "Afrimoney"
      : "Orange Money";

  $: pendingSteps = pendingPayment
    ? [
        `Dial the code ${pendingPayment.ussdCode} on your mobile phone.`,
        `Follow the prompts to confirm payment.`,
        `Enter your ${carrierLabel} PIN to authorize the transaction.`,
        `Wait for a confirmation SMS from ${carrierLabel}.`,
        "Once confirmed, open My Tickets and tap Show entry QR.",
      ]
    : [];

  $: lineItems = ticketTypes
    .filter((t) => (selectedTickets[t.id] || 0) > 0)
    .map((t) => {
      const quantity = selectedTickets[t.id] || 0;
      return {
        name: t.name,
        quantity,
        lineTotal: t.price * quantity,
      };
    });

  $: baseTotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  $: bookingFee = calculateBookingFee(baseTotal);
  $: totalWithFee = baseTotal + bookingFee;
  $: totalSelected = Object.values(selectedTickets).reduce(
    (sum, qty) => sum + (qty || 0),
    0
  );

  function formatHeroDateTime(date, time) {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return String(date);
    const datePart = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!time) return datePart;
    try {
      const iso = `${date}T${time.length === 5 ? `${time}:00` : time}`;
      const t = new Date(iso);
      if (!Number.isNaN(t.getTime())) {
        const timePart = t.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
        return `${datePart} · ${timePart}`;
      }
    } catch {
      /* ignore */
    }
    return `${datePart} · ${time}`;
  }

  function bounceToEvent() {
    goto(`/marketplace/eventDetails/${eventId}`);
  }

  function deriveOrderRef(name, id) {
    const words = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    let initials = words
      .map((w) => w[0])
      .join("")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 3);
    if (!initials) initials = "ORD";
    const digits = String(id || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(-4)
      .toUpperCase();
    const suffix = digits.padStart(4, "0");
    return `#${initials}-${suffix}`;
  }

  function isMobileCheckoutViewport() {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1023px)").matches;
  }

  function formatNle(n) {
    return Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function showFailedPayment(reason) {
    const amount = pendingPayment?.amount ?? totalWithFee;
    failedPayment = {
      amountLabel: `NLe ${formatNle(amount)}`,
      reason,
      orderId: orderRef,
    };
    clearPending();
  }

  function clearFailedPayment() {
    failedPayment = null;
    paymentStatus = "idle";
  }

  function handleFailedTryAgain() {
    clearFailedPayment();
  }

  function handleFailedChooseMethod() {
    clearFailedPayment();
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  function stopCountdown() {
    if (timeInterval) {
      clearInterval(timeInterval);
      timeInterval = null;
    }
  }

  function startCountdown(seconds = PAYMENT_CODE_TTL_SECONDS) {
    stopCountdown();
    timeRemaining = Math.max(0, Math.floor(seconds));
    timeInterval = setInterval(() => {
      if (timeRemaining > 0) {
        timeRemaining -= 1;
        return;
      }
      stopCountdown();
      if (paymentStatus === "pending" && pendingPayment) {
        paymentStatus = "expired";
        stopPolling();
        showFailedPayment("Payment code expired");
      }
    }, 1000);
  }

  function clearPending() {
    stopPolling();
    stopCountdown();
    pendingPayment = null;
    paymentStatus = "idle";
    isProcessingPayment = false;
    cancelingPayment = false;
    timeRemaining = 0;
  }

  async function handleCancelPending() {
    if (cancelingPayment || !pendingPayment || isProcessingPayment) return;
    cancelingPayment = true;
    const codeId = pendingPayment.paymentCodeId;
    stopPolling();
    try {
      if (codeId) {
        await monimeService.cancelPaymentCode(codeId);
      }
    } catch {
      /* code may already be used or expired */
    }
    clearPending();
    showToast(
      "info",
      "Payment canceled",
      "You can generate a new payment code when ready."
    );
  }

  function startPolling() {
    stopPolling();
    paymentStatus = "pending";
    isProcessingPayment = false;
    startCountdown(PAYMENT_CODE_TTL_SECONDS);
    checkPaymentStatus();
    pollingInterval = setInterval(checkPaymentStatus, 3000);
  }

  async function waitForWebhookOrder(paymentCodeId, method) {
    const started = Date.now();
    while (Date.now() - started < ORDER_WAIT_MAX_MS) {
      try {
        const params = new URLSearchParams({
          eventId: String(eventId || ""),
          transactionId: paymentCodeId,
          paymentMethod: method || "orange_money",
        });
        const res = await fetch(`/api/orders/by-payment?${params.toString()}`);
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.success && body.found && body.orderId) {
          return { ok: true, orderId: body.orderId };
        }
        if (res.status === 403) {
          return { ok: false, error: "Order ownership mismatch" };
        }
      } catch (err) {
        console.error("Order wait poll error:", err);
      }
      await new Promise((r) => setTimeout(r, ORDER_WAIT_INTERVAL_MS));
    }
    return {
      ok: false,
      error:
        "Payment received but tickets are still being created. Sign in later to see My Tickets.",
    };
  }

  async function checkPaymentStatus() {
    if (
      !pendingPayment?.paymentCodeId ||
      paymentStatus !== "pending" ||
      isProcessingPayment
    ) {
      return;
    }

    try {
      const status = await monimeService.getPaymentCodeStatus(
        pendingPayment.paymentCodeId
      );

      if (status.status === "completed") {
        if (isProcessingPayment) return;
        isProcessingPayment = true;
        paymentStatus = "completed";
        stopPolling();

        // Webhook is fulfill truth (5.4); wait for order by payment code id
        const waited = await waitForWebhookOrder(
          pendingPayment.paymentCodeId,
          pendingPayment.paymentMethod
        );

        if (waited.ok) {
          showToast(
            "success",
            "Payment Successful!",
            "Your tickets have been purchased successfully."
          );
          try {
            sessionStorage.removeItem(STORAGE_KEY);
          } catch {
            /* ignore */
          }
          const orderId = waited.orderId;
          clearPending();
          if (orderId) {
            goto(
              `/marketplace/eventDetails/${eventId}/checkout/success?orderId=${orderId}`
            );
          }
        } else {
          isProcessingPayment = false;
          paymentStatus = "error";
          showFailedPayment(waited.error || "Could not create order");
        }
      } else if (
        status.status === "cancelled" ||
        status.status === "expired" ||
        status.status === "failed"
      ) {
        paymentStatus = status.status;
        stopPolling();
        if (status.status === "failed") {
          showFailedPayment("Insufficient balance or timeout");
        } else if (status.status === "expired") {
          showFailedPayment("Payment code expired");
        } else {
          clearPending();
        }
      }
    } catch (error) {
      console.error("Payment status check error:", error);
    }
  }

  onMount(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        bounceToEvent();
        return;
      }
      const parsed = JSON.parse(raw);
      if (
        !parsed ||
        parsed.eventId !== eventId ||
        !parsed.selectedTickets ||
        typeof parsed.selectedTickets !== "object"
      ) {
        sessionStorage.removeItem(STORAGE_KEY);
        bounceToEvent();
        return;
      }

      selectedTickets = parsed.selectedTickets;
      const qty = Object.values(selectedTickets).reduce(
        (sum, n) => sum + (n || 0),
        0
      );
      const paid = ticketTypes.reduce((sum, t) => {
        const q = selectedTickets[t.id] || 0;
        return sum + (t.price > 0 ? q : 0);
      }, 0);

      if (qty !== 1 || paid < 1 || baseTotalFromSelection(selectedTickets) <= 0) {
        sessionStorage.removeItem(STORAGE_KEY);
        bounceToEvent();
        return;
      }

      ready = true;
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      bounceToEvent();
    }
  });

  onDestroy(() => {
    stopPolling();
    stopCountdown();
  });

  function baseTotalFromSelection(selection) {
    return ticketTypes.reduce((total, ticket) => {
      return total + ticket.price * (selection[ticket.id] || 0);
    }, 0);
  }

  function buildTicketDetails() {
    let totalPrice = 0;
    const ticketDetails = [];
    for (const [ticketTypeId, quantity] of Object.entries(selectedTickets)) {
      if (quantity > 0) {
        const ticketType = ticketTypes.find((t) => t.id === ticketTypeId);
        if (ticketType) {
          totalPrice += ticketType.price * quantity;
          ticketDetails.push({
            id: ticketType.id,
            name: ticketType.name,
            price: ticketType.price,
            quantity,
          });
        }
      }
    }
    return { totalPrice, ticketDetails };
  }

  async function handleGenerate() {
    if (creating || !event || pendingPayment) return;

    if (!phone.trim()) {
      showToast(
        "error",
        "Phone required",
        "Enter a mobile money phone number."
      );
      return;
    }

    if (isMobileCheckoutViewport() && !fullName.trim()) {
      showToast("error", "Name required", "Enter your full name to continue.");
      return;
    }

    if (totalSelected !== 1) {
      showToast(
        "warning",
        "Mobile Money Limitation",
        "Mobile money payments are currently limited to 1 ticket per order. Please select only 1 ticket."
      );
      return;
    }

    creating = true;
    try {
      showToast("info", "Setting up payment", "Creating payment code…");
      const { totalPrice, ticketDetails } = buildTicketDetails();
      if (totalPrice <= 0) {
        throw new Error("Invalid ticket selection");
      }
      const fee = calculateBookingFee(totalPrice);
      const total = totalPrice + fee;
      const buyerName =
        fullName.trim() ||
        web3User?.display_name ||
        web3User?.username ||
        "Guest User";

      const purchaseData = {
        eventId,
        eventName: event?.name || "Event",
        selectedTickets,
        totalAmount: totalPrice,
        ticketDetails,
        buyerInfo: {
          wallet_address: connectedWalletAddress || undefined,
          name: buyerName,
          phone: phone.trim(),
        },
      };

      const result = await handleMobileMoneyPaymentWithCode(
        purchaseData,
        paymentMethod
      );

      if (result.success && result.paymentCodeId && result.ussdCode) {
        pendingPayment = {
          paymentCodeId: result.paymentCodeId,
          ussdCode: result.ussdCode,
          amount: total,
          paymentMethod,
          purchaseData,
        };
        startPolling();
      } else {
        throw new Error(result.error || "Failed to create payment code");
      }
    } catch (err) {
      showToast(
        "error",
        "Payment Setup Failed",
        `Failed to setup payment: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      creating = false;
    }
  }
</script>

<svelte:head>
  <title
    >{event?.name
      ? `Checkout · ${event.name} · SOS SEATS`
      : "Checkout · SOS SEATS"}</title
  >
</svelte:head>

{#if !event}
  <div class="flex h-full min-h-0 items-center justify-center bg-paper p-8">
    <div class="max-w-md rounded-2xl border border-paper-border bg-white p-8 text-center">
      <h1 class="m-0 text-xl font-bold text-ink">Checkout unavailable</h1>
      <p class="mt-2 text-sm text-ink-secondary">This event was not found.</p>
      <a
        href="/marketplace"
        class="mt-6 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white no-underline"
      >
        Back to Marketplace
      </a>
    </div>
  </div>
{:else if ready && failedPayment}
  <MarketplaceCheckoutFailedLayout
    badge="PAYMENT FAILED"
    title={event.name}
    date={heroDateTime}
    location={heroVenue}
    image={event.image}
    eventName={event.name}
    amountLabel={failedPayment.amountLabel}
    reason={failedPayment.reason}
    orderId={failedPayment.orderId}
    onTryAgain={handleFailedTryAgain}
    onChooseMethod={handleFailedChooseMethod}
  />
{:else if ready && pendingPayment}
  <CheckoutPendingLayout
    badge="Processing"
    title={event.name}
    date={heroDateTime}
    location={heroVenue}
    image={event.image}
    ussdCode={pendingPayment.ussdCode}
    transactionRef={pendingPayment.paymentCodeId}
    carrier={carrierLabel}
    {timeRemaining}
    amountLabel={`NLe ${formatNle(pendingPayment.amount)}`}
    {orderRef}
    steps={pendingSteps}
    canceling={cancelingPayment}
    onCancel={handleCancelPending}
  />
{:else if ready}
  <div class="flex h-full min-h-0 flex-col bg-[#faf8f5] lg:flex-row lg:bg-transparent">
    <div class="hidden lg:contents">
      <CheckoutEventHero
        badge="PAY NOW"
        title={event.name}
        date={heroDateTime}
        location={heroVenue}
        image={event.image}
        fillParent
      />
    </div>

    <div
      class="relative flex flex-1 flex-col items-stretch overflow-hidden px-0 lg:w-1/2 lg:items-center lg:justify-center lg:bg-paper lg:px-8 lg:py-8"
    >
      <div
        class="pointer-events-none absolute inset-0 hidden lg:block"
        aria-hidden="true"
      >
        <AuthPanelDecor />
      </div>

      <div
        class="relative z-10 flex w-full items-center justify-between px-5 py-3 lg:hidden"
      >
        <h1 class="m-0 text-xl font-extrabold text-ink">Secure Checkout</h1>
        <span
          class="rounded-full border border-paper-border bg-white px-2.5 py-1.5 text-[10px] font-bold text-ink-secondary"
        >
          ORDER: {orderRef}
        </span>
      </div>

      <div class="relative z-10 w-full px-5 pb-5 pt-4 lg:max-w-[440px] lg:px-0 lg:py-0">
        <MarketplaceCheckoutCard
          eventName={event.name}
          {lineItems}
          {bookingFee}
          {totalWithFee}
          bind:paymentMethod
          bind:phone
          bind:fullName
          loading={creating}
          onGenerate={handleGenerate}
        />
      </div>
    </div>
  </div>
{/if}
