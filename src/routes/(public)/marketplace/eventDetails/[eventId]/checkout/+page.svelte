<script>
  // @ts-nocheck
  /**
   * Marketplace paid MM checkout — desktop 55:450 / mobile 4:407.
   */
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { handleMobileMoneyPaymentWithCode } from "$lib/orangeMoneyPayment";
  import { calculateBookingFee } from "$lib/fees";
  import { walletStore, web3UserStore, showToast } from "$lib/store";
  import AuthPanelDecor from "$lib/components/auth/AuthPanelDecor.svelte";
  import CheckoutEventHero from "$lib/components/checkout/CheckoutEventHero.svelte";
  import MarketplaceCheckoutCard from "$lib/components/public/MarketplaceCheckoutCard.svelte";
  import MobileMoneyPaymentModal from "$lib/components/MobileMoneyPaymentModal.svelte";

  const STORAGE_KEY = "sos_mm_checkout";

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
  let showPaymentModal = false;
  let paymentModalData = null;

  $: connectedWalletAddress = $walletStore?.address || null;
  $: web3User = $web3UserStore?.user || null;

  $: heroDateTime = formatHeroDateTime(event?.dateRaw, event?.time);
  $: heroVenue = (event?.location || event?.venue || "").trim();
  $: orderRef = deriveOrderRef(event?.name, eventId);

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
    if (creating || !event) return;

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
      showToast(
        "info",
        "Setting up payment",
        "Creating payment code…"
      );
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
        paymentModalData = {
          paymentCodeId: result.paymentCodeId,
          ussdCode: result.ussdCode,
          amount: total,
          currency: "NLe",
          paymentMethod,
          purchaseData,
        };
        showPaymentModal = true;
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

  function handlePaymentSuccess(e) {
    const orderId = e?.detail?.orderId;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    showPaymentModal = false;
    paymentModalData = null;
    if (orderId) {
      goto(`/tickets/confirmation/${orderId}`);
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
  <div class="flex min-h-screen items-center justify-center bg-paper p-8">
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
{:else if ready}
  <div class="flex min-h-screen flex-col bg-[#faf8f5] lg:flex-row lg:bg-transparent">
    <div class="hidden lg:contents">
      <CheckoutEventHero
        badge="PAY NOW"
        title={event.name}
        date={heroDateTime}
        location={heroVenue}
        image={event.image}
      />
    </div>

    <div
      class="relative flex flex-1 flex-col items-stretch overflow-hidden px-0 lg:w-1/2 lg:items-center lg:justify-center lg:bg-paper lg:px-8 lg:py-6"
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
      on:success={handlePaymentSuccess}
    />
  {/if}
{/if}
