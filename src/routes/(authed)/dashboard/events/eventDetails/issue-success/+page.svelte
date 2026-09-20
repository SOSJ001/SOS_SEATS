<script>
  // @ts-nocheck
  /** Wallet private-issue success — HI-FI 389:125 / desktop 527:798. */
  import CheckoutSuccessLayout from "$lib/components/checkout/CheckoutSuccessLayout.svelte";

  export let data;

  $: event = data.event;
  $: error = data.error;
  $: qty = data.qty || 1;
  $: feeTotal = data.feeTotal ?? qty * 0.99;
  $: paymentMethod = data.paymentMethod || "Wallet Balance";
  $: timestamp = data.timestamp || "";

  function formatNle(n) {
    return Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  $: ticketWord = qty === 1 ? "ticket" : "tickets";
  $: subtitle = `${qty} ${ticketWord} have been issued and added to the guest list.`;
  $: bannerText = `✓ All ${qty} ${ticketWord} are now on the guest list`;
  $: ticketsLabel = `${qty} Ticket${qty === 1 ? "" : "s"}`;
  $: amountLabel = `NLe ${formatNle(feeTotal)}`;
  $: primaryHref = event?.id
    ? `/dashboard/events/eventDetails?id=${event.id}&tab=guests`
    : "/dashboard/events";
  $: secondaryHref = event?.id
    ? `/dashboard/events/eventDetails?id=${event.id}&tab=generate`
    : "/dashboard/events";
</script>

{#if error || !event}
  <div class="flex min-h-screen items-center justify-center bg-paper p-8">
    <div class="max-w-md rounded-2xl border border-paper-border bg-white p-8 text-center">
      <h1 class="m-0 text-xl font-bold text-ink">Success unavailable</h1>
      <p class="mt-2 text-sm text-ink-secondary">{error || "Missing event."}</p>
      <a
        href="/dashboard/events"
        class="mt-6 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white no-underline"
      >
        Back to Events
      </a>
    </div>
  </div>
{:else}
  <CheckoutSuccessLayout
    badge="SUCCESS"
    title={event.title}
    date={event.date}
    location={event.location}
    image={event.image}
    ticketLabel={`${qty} ${ticketWord}`}
    headline="Tickets Issued Successfully"
    {subtitle}
    {bannerText}
    eventName={event.title}
    {ticketsLabel}
    {amountLabel}
    {paymentMethod}
    {timestamp}
    primaryLabel="View Guest List"
    {primaryHref}
    secondaryLabel="Issue More Tickets"
    {secondaryHref}
  />
{/if}
