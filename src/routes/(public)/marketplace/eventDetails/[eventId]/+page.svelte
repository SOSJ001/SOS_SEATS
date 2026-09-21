<script>
  // @ts-nocheck
  /**
   * Marketplace event detail — desktop HI-FI 759:1333 / 154:123; mobile 4:179 / 154:50.
   */
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { calculateBookingFee } from "$lib/fees";
  import { showToast } from "$lib/store";
  import EventDetailHero from "$lib/components/public/EventDetailHero.svelte";
  import EventPurchaseCard from "$lib/components/public/EventPurchaseCard.svelte";
  import EventAboutOrganizer from "$lib/components/public/EventAboutOrganizer.svelte";
  import EventRelatedSection from "$lib/components/public/EventRelatedSection.svelte";
  import Calendar from "lucide-svelte/icons/calendar";
  import MapPin from "lucide-svelte/icons/map-pin";

  const MM_CHECKOUT_KEY = "sos_mm_checkout";
  const FREE_CLAIM_KEY = "sos_free_claim";

  export let data;

  $: eventId = $page.params.eventId;
  $: event = data?.event || null;
  $: ticketTypes = data?.ticketTypes || event?.ticket_types || [];
  $: relatedEvents = data?.relatedEvents || [];

  let selectedTickets = {};

  $: ticketTypes.forEach((ticket) => {
    if (selectedTickets[ticket.id] == null) {
      selectedTickets[ticket.id] = 0;
    }
  });

  $: totalSelected = Object.values(selectedTickets).reduce(
    (sum, qty) => sum + (qty || 0),
    0
  );

  $: paidSelected = ticketTypes.reduce((sum, t) => {
    const qty = selectedTickets[t.id] || 0;
    return sum + (t.price > 0 ? qty : 0);
  }, 0);

  $: freeOnlySelected =
    totalSelected > 0 &&
    paidSelected === 0 &&
    ticketTypes.some((t) => (selectedTickets[t.id] || 0) > 0 && t.price === 0);

  $: baseTotal = ticketTypes.reduce((total, ticket) => {
    return total + ticket.price * (selectedTickets[ticket.id] || 0);
  }, 0);

  $: bookingFee = calculateBookingFee(baseTotal);
  $: totalWithFee = baseTotal + bookingFee;

  $: ctaLabel = freeOnlySelected ? "Claim Free" : "Mobile money";
  $: disclaimer = freeOnlySelected
    ? "By claiming, you agree to the event terms and venue entry rules. Your free ticket will be issued instantly and saved to your My Tickets dashboard."
    : "";

  $: heroBadge = (() => {
    const loc = (event?.location || event?.venue || "").trim();
    if (!loc) return "LIVE IN FREETOWN";
    const place = loc.split(",")[0].trim().toUpperCase();
    return place ? `LIVE IN ${place}` : "LIVE IN FREETOWN";
  })();

  $: heroDateTime = formatHeroDateTime(event?.dateRaw, event?.time);
  $: heroVenue = (event?.location || event?.venue || "").trim();
  $: aboutDescription = (event?.description || "").trim();
  $: showAboutBlock =
    !!aboutDescription || !!(event?.organizer || "").trim();

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

  function handleQuantityChange(ticketId, newQuantity) {
    const ticketType = ticketTypes.find((t) => t.id === ticketId);
    if (!ticketType) return;

    const maxSeatsPerOrder = event?.seating_options?.max_seats_per_order || 10;
    const eventTotalCapacity = event?.total_capacity || 100;
    const ticketTypeCapacity = ticketType.available_quantity;

    const otherTicketsTotal = Object.entries(selectedTickets)
      .filter(([id]) => id !== ticketId)
      .reduce((sum, [, qty]) => sum + qty, 0);

    if (ticketTypeCapacity <= 0) {
      showToast(
        "error",
        "Sold Out",
        `Sorry, ${ticketType.name} tickets are sold out.`
      );
      return;
    }

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
        `Sorry, only ${ticketTypeCapacity} ${ticketType.name} tickets are available.`
      );
      return;
    }

    if (otherTicketsTotal + newQuantity > eventTotalCapacity) {
      showToast(
        "warning",
        "Event Capacity",
        `Cannot select more than ${eventTotalCapacity} tickets total for this event.`
      );
      return;
    }

    selectedTickets[ticketId] = Math.max(0, newQuantity);
    selectedTickets = { ...selectedTickets };
  }

  function handlePrimary() {
    if (totalSelected === 0) return;
    if (freeOnlySelected) {
      handleGetFreeTicket();
      return;
    }

    if (totalSelected > 1) {
      showToast(
        "warning",
        "Mobile Money Limitation",
        "Mobile money payments are currently limited to 1 ticket per order. Please select only 1 ticket."
      );
      return;
    }

    if (paidSelected < 1 || baseTotal <= 0) {
      showToast(
        "warning",
        "No Paid Tickets",
        "Select a paid ticket to continue to checkout."
      );
      return;
    }

    try {
      sessionStorage.setItem(
        MM_CHECKOUT_KEY,
        JSON.stringify({ eventId, selectedTickets })
      );
    } catch {
      showToast(
        "error",
        "Checkout unavailable",
        "Could not save your selection. Please try again."
      );
      return;
    }

    goto(`/marketplace/eventDetails/${eventId}/checkout`);
  }

  function handleGetFreeTicket() {
    if (totalSelected === 0) {
      showToast("warning", "No Tickets Selected", "Please select at least 1 ticket.");
      return;
    }

    const maxSeatsPerOrder = event?.seating_options?.max_seats_per_order || 10;
    for (const [, quantity] of Object.entries(selectedTickets)) {
      if (quantity > maxSeatsPerOrder) {
        showToast(
          "warning",
          "Quantity Limit",
          `Cannot select more than ${maxSeatsPerOrder} tickets of any type per order.`
        );
        return;
      }
    }

    try {
      sessionStorage.setItem(
        FREE_CLAIM_KEY,
        JSON.stringify({ eventId, selectedTickets })
      );
    } catch {
      showToast(
        "error",
        "Claim unavailable",
        "Could not save your selection. Please try again."
      );
      return;
    }

    goto(`/marketplace/eventDetails/${eventId}/claim`);
  }
</script>

<svelte:head>
  <title>{event?.name ? `${event.name} · SOS SEATS` : "Event · SOS SEATS"}</title>
</svelte:head>

{#if !event}
  <div class="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-5 py-16 text-center">
    <h1 class="m-0 font-display text-2xl font-bold text-ink">Event Not Found</h1>
    <p class="m-0 text-ink-secondary">This event may be private or no longer available.</p>
    <a
      href="/marketplace"
      class="rounded-xl bg-brand px-6 py-3 text-sm font-extrabold text-white no-underline shadow-public-cta"
    >
      Back to Marketplace
    </a>
  </div>
{:else}
  <!-- Mobile stack — Figma 4:179 / 154:50 -->
  <div class="lg:hidden">
    {#if event.image}
      <div class="relative h-[280px] w-full overflow-hidden bg-slate-public">
        <img
          src={event.image}
          alt=""
          class="pointer-events-none absolute inset-0 size-full max-w-none scale-110 object-cover blur-xl"
          aria-hidden="true"
        />
        <img
          src={event.image}
          alt=""
          class="absolute inset-0 size-full max-w-none object-contain"
        />
      </div>
    {:else}
      <div class="h-[280px] w-full bg-slate-public" aria-hidden="true"></div>
    {/if}

    <div class="flex flex-col gap-3 bg-white px-5 pb-4 pt-5">
      <h1 class="m-0 font-display text-2xl font-bold leading-[1.2] text-ink">
        {event.name}
      </h1>
      <div class="flex flex-col gap-2">
        {#if heroDateTime}
          <div class="flex items-center gap-2">
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-[14px] bg-[#fff1ec] text-brand"
              aria-hidden="true"
            >
              <Calendar size={14} />
            </span>
            <p class="m-0 text-[13px] font-semibold text-[#1c0b1e]">{heroDateTime}</p>
          </div>
        {/if}
        {#if heroVenue}
          <div class="flex items-center gap-2">
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-[14px] bg-[#fff1ec] text-brand"
              aria-hidden="true"
            >
              <MapPin size={14} />
            </span>
            <p class="m-0 text-[13px] font-semibold text-[#1c0b1e]">{heroVenue}</p>
          </div>
        {/if}
      </div>
    </div>

    {#if showAboutBlock}
      <div class="px-0">
        <EventAboutOrganizer
          description={aboutDescription}
          organizerName={event.organizer}
        />
      </div>
    {/if}

    <EventPurchaseCard
      {ticketTypes}
      {selectedTickets}
      {bookingFee}
      {totalWithFee}
      {ctaLabel}
      disclaimer=""
      disabled={totalSelected === 0}
      loading={false}
      onQuantityChange={handleQuantityChange}
      onPrimary={handlePrimary}
    />
  </div>

  <!-- Desktop — Figma 759:1333 / 154:123 -->
  <div class="hidden lg:block">
    <EventDetailHero
      title={event.name}
      dateTime={heroDateTime}
      venue={heroVenue}
      badge={heroBadge}
      image={event.image}
    >
      <EventPurchaseCard
        {ticketTypes}
        {selectedTickets}
        {bookingFee}
        {totalWithFee}
        {ctaLabel}
        {disclaimer}
        disabled={totalSelected === 0}
        loading={false}
        onQuantityChange={handleQuantityChange}
        onPrimary={handlePrimary}
      />
    </EventDetailHero>

    <div class="flex flex-col gap-8 px-5 pb-16 pt-10 md:px-20 md:pb-20">
      <div class="h-px w-full bg-paper-border" aria-hidden="true"></div>

      {#if showAboutBlock}
        <EventAboutOrganizer
          description={aboutDescription}
          organizerName={event.organizer}
        />
      {/if}

      <EventRelatedSection events={relatedEvents} />
    </div>
  </div>
{/if}
