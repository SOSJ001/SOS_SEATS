<script>
  // @ts-nocheck
  /**
   * Wallet-issue success — desktop HI-FI 527:798 / mobile HI-FI 389:125.
   * CheckoutEventHero + AuthPanelDecor + CheckoutSuccessCard.
   */
  import AuthPanelDecor from "$lib/components/auth/AuthPanelDecor.svelte";
  import CheckoutEventHero from "$lib/components/checkout/CheckoutEventHero.svelte";
  import CheckoutSuccessCard from "$lib/components/checkout/CheckoutSuccessCard.svelte";

  export let badge = "SUCCESS";
  export let title = "";
  export let date = "";
  export let location = "";
  /** @type {string | null} */
  export let image = null;
  export let ticketLabel = "";

  export let headline = "Tickets Issued Successfully";
  export let subtitle = "";
  export let bannerText = "";
  export let eventName = "";
  export let ticketsLabel = "";
  export let amountLabel = "";
  export let paymentMethod = "Wallet Balance";
  export let timestamp = "";
  export let primaryLabel = "View Guest List";
  export let primaryHref = "#";
  export let secondaryLabel = "Issue More Tickets";
  export let secondaryHref = "#";
</script>

<div class="flex min-h-screen flex-col lg:flex-row">
  <CheckoutEventHero
    {badge}
    {title}
    {date}
    {location}
    {image}
    {ticketLabel}
  />

  <div
    class="relative flex flex-1 items-start justify-center overflow-hidden bg-paper px-4 pb-6 pt-5 lg:w-1/2 lg:items-center lg:px-8 lg:py-6"
  >
    <div
      class="pointer-events-none absolute inset-0 hidden lg:block"
      aria-hidden="true"
    >
      <AuthPanelDecor />
    </div>
    <CheckoutSuccessCard
      {headline}
      {subtitle}
      {bannerText}
      {eventName}
      {ticketsLabel}
      {amountLabel}
      {paymentMethod}
      {timestamp}
      {primaryLabel}
      {primaryHref}
      {secondaryLabel}
      {secondaryHref}
    />
  </div>
</div>
