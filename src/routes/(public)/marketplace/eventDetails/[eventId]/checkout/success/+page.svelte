<script>
  // @ts-nocheck
  /** Buyer MM checkout success — Figma desktop-checkout-success 787:1466. */
  import MarketplaceCheckoutSuccessLayout from "$lib/components/checkout/MarketplaceCheckoutSuccessLayout.svelte";

  export let data;

  $: event = data.event;
  $: order = data.order;

  function formatHeroDateTime(dateRaw, time) {
    if (!dateRaw) return "Date TBD";
    const d = new Date(dateRaw);
    if (Number.isNaN(d.getTime())) return dateRaw;
    const datePart = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!time) return datePart;
    try {
      const iso = `${dateRaw}T${time.length === 5 ? `${time}:00` : time}`;
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

  function formatNle(n) {
    return Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  $: heroDateTime = formatHeroDateTime(event?.dateRaw, event?.time);
  $: heroVenue = (event?.location || event?.venue || "").trim();
  $: amountLabel = `NLe ${formatNle(order?.amount)}`;
  $: shareUrl = event?.id
    ? `/marketplace/eventDetails/${event.id}`
    : "/marketplace";
</script>

<svelte:head>
  <title
    >{event?.name
      ? `Payment Confirmed · ${event.name} · SOS SEATS`
      : "Payment Confirmed · SOS SEATS"}</title
  >
</svelte:head>

{#if !event || !order}
  <div class="flex h-full min-h-0 items-center justify-center bg-paper p-8">
    <div class="max-w-md rounded-2xl border border-paper-border bg-white p-8 text-center">
      <h1 class="m-0 text-xl font-bold text-ink">Success unavailable</h1>
      <p class="mt-2 text-sm text-ink-secondary">
        We could not load this order confirmation.
      </p>
      <a
        href="/marketplace"
        class="mt-6 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white no-underline"
      >
        Back to Marketplace
      </a>
    </div>
  </div>
{:else}
  <MarketplaceCheckoutSuccessLayout
    badge="TICKET SECURED"
    title={event.name}
    date={heroDateTime}
    location={heroVenue}
    image={event.image}
    eventName={event.name}
    eventDate={event.dateRaw}
    eventTime={event.time}
    eventLocation={heroVenue}
    ticketTypes={order.ticketTypes}
    ticketCount={order.ticketCount}
    {amountLabel}
    paymentMethod={order.paymentMethod}
    timestamp={order.timestamp}
    orderNumber={order.orderNumber}
    {shareUrl}
    primaryHref="/dashboard/my-tickets"
    browseHref="/marketplace"
  />
{/if}
