<script>
  // @ts-nocheck
  /**
   * Free claim success — mobile HI-FI 1176:2090 / desktop 1161:1993.
   */
  import AuthPanelDecor from "$lib/components/auth/AuthPanelDecor.svelte";
  import CheckoutEventHero from "$lib/components/checkout/CheckoutEventHero.svelte";
  import FreeClaimSuccessCard from "$lib/components/public/FreeClaimSuccessCard.svelte";
  import FreeClaimSuccessMobile from "$lib/components/public/FreeClaimSuccessMobile.svelte";

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
  export let dateTimeLabel = "";
  /** @type {Array<{ name?: string }>} */
  export let ticketTypes = [{ name: "Free" }];
  export let ticketCount = 1;
  export let orderNumber = "";
  export let shareUrl = "/marketplace";
  export let primaryHref = "/dashboard/my-tickets";
  export let browseHref = "/marketplace";

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

<!-- Mobile HI-FI 1176:2090 -->
<div class="h-full min-h-0 overflow-y-auto lg:hidden">
  <FreeClaimSuccessMobile
    {eventName}
    {dateLabel}
    {dateTimeLabel}
    {eventLocation}
    {orderNumber}
    {ticketCount}
    {shareUrl}
    {primaryHref}
    {browseHref}
  />
</div>

<!-- Desktop HI-FI 1161:1993 -->
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
    <div class="relative z-10 my-auto w-full max-w-[480px]">
      <FreeClaimSuccessCard
        {eventName}
        {eventDate}
        {eventTime}
        {eventLocation}
        {ticketTypes}
        {ticketCount}
        {orderNumber}
        {shareUrl}
        {primaryHref}
        {browseHref}
      />
    </div>
  </div>
</div>
