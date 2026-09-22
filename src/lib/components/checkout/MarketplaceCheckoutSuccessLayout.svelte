<script>
  // @ts-nocheck
  /**
   * Buyer checkout success — mobile HI-FI 281:77 / desktop 787:1466.
   */
  import AuthPanelDecor from "$lib/components/auth/AuthPanelDecor.svelte";
  import CheckoutEventHero from "$lib/components/checkout/CheckoutEventHero.svelte";
  import MarketplaceCheckoutSuccessCard from "$lib/components/checkout/MarketplaceCheckoutSuccessCard.svelte";
  import MarketplaceCheckoutSuccessMobile from "$lib/components/checkout/MarketplaceCheckoutSuccessMobile.svelte";

  export let badge = "TICKET SECURED";
  export let title = "";
  export let date = "";
  export let location = "";
  /** @type {string | null} */
  export let image = null;

  export let eventName = "";
  export let eventDate = "";
  export let eventTime = "";
  export let eventLocation = "";
  /** @type {Array<{ name?: string }>} */
  export let ticketTypes = [];
  export let ticketCount = 1;
  export let amountLabel = "";
  export let paymentMethod = "Orange Money";
  export let timestamp = "";
  export let orderNumber = "";
  export let shareUrl = "/marketplace";
  export let primaryHref = "/dashboard/my-tickets";
  export let browseHref = "/marketplace";

  $: ticketTier = ticketTypes?.[0]?.name || "Ticket";

  $: dateLabel = formatTicketDate(eventDate);

  function formatTicketDate(dateRaw) {
    if (!dateRaw) return "";
    const d = new Date(dateRaw);
    if (Number.isNaN(d.getTime())) return String(dateRaw);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
</script>

<!-- Mobile HI-FI 281:77 -->
<div class="h-full min-h-0 overflow-y-auto lg:hidden">
  <MarketplaceCheckoutSuccessMobile
    {eventName}
    {dateLabel}
    {eventLocation}
    {amountLabel}
    {paymentMethod}
    {timestamp}
    {orderNumber}
    {ticketTier}
    {shareUrl}
    {primaryHref}
    {browseHref}
  />
</div>

<!-- Desktop HI-FI 787:1466 -->
<div
  class="hidden h-full min-h-0 flex-col lg:flex lg:flex-row lg:overflow-hidden"
>
  <CheckoutEventHero
    {badge}
    badgeVariant="brand"
    {title}
    {date}
    {location}
    {image}
    fillParent
  />

  <div
    class="relative flex flex-1 flex-col items-center overflow-y-auto bg-paper px-4 py-5 lg:h-full lg:w-1/2 lg:px-8 lg:py-6"
  >
    <div
      class="pointer-events-none absolute inset-0 hidden lg:block"
      aria-hidden="true"
    >
      <AuthPanelDecor />
    </div>
    <!-- my-auto: center when short; top-align + scroll when taller than viewport -->
    <div class="relative z-10 my-auto w-full max-w-[480px]">
      <MarketplaceCheckoutSuccessCard
        {eventName}
        {eventDate}
        {eventTime}
        {eventLocation}
        {ticketTypes}
        {ticketCount}
        {amountLabel}
        {paymentMethod}
        {timestamp}
        {orderNumber}
        {shareUrl}
        {primaryHref}
        {browseHref}
      />
    </div>
  </div>
</div>
