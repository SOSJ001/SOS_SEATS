<script>
  // @ts-nocheck
  /**
   * Marketplace checkout pending — mobile HI-FI 4:454 / desktop 55:521.
   */
  import AuthPanelDecor from "$lib/components/auth/AuthPanelDecor.svelte";
  import CheckoutEventHero from "$lib/components/checkout/CheckoutEventHero.svelte";
  import CheckoutPendingCard from "$lib/components/checkout/CheckoutPendingCard.svelte";
  import CheckoutPendingMobile from "$lib/components/checkout/CheckoutPendingMobile.svelte";

  export let badge = "Processing";
  export let title = "";
  export let date = "";
  export let location = "";
  /** @type {string | null} */
  export let image = null;
  export let ticketLabel = "";

  export let ussdCode = "";
  export let transactionRef = "";
  export let carrier = "Orange Money";
  export let timeRemaining = 0;
  export let amountLabel = "";
  export let orderRef = "";
  export let subtitle =
    "Complete the prompt on your phone. You can close this page - the order will be created automatically.";
  /** @type {string[]} */
  export let steps = [];
  export let canceling = false;
  /** @type {() => void} */
  export let onCancel = () => {};
</script>

<!-- Mobile HI-FI 4:454 -->
<div class="h-full min-h-0 overflow-y-auto lg:hidden">
  <CheckoutPendingMobile
    {ussdCode}
    {timeRemaining}
    {carrier}
    {amountLabel}
    {orderRef}
    {canceling}
    {onCancel}
  />
</div>

<!-- Desktop HI-FI 55:521 -->
<div class="hidden h-full min-h-0 flex-col lg:flex lg:flex-row lg:overflow-hidden">
  <CheckoutEventHero
    {badge}
    {title}
    {date}
    {location}
    {image}
    {ticketLabel}
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
      <CheckoutPendingCard
        {ussdCode}
        {transactionRef}
        {carrier}
        {timeRemaining}
        {subtitle}
        {steps}
        {canceling}
        {onCancel}
      />
    </div>
  </div>
</div>
