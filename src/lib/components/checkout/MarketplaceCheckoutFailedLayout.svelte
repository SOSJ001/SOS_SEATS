<script>
  // @ts-nocheck
  /**
   * Buyer checkout failed — mobile HI-FI 281:110 / desktop 787:1576.
   */
  import AuthPanelDecor from "$lib/components/auth/AuthPanelDecor.svelte";
  import CheckoutEventHero from "$lib/components/checkout/CheckoutEventHero.svelte";
  import MarketplaceCheckoutFailedCard from "$lib/components/checkout/MarketplaceCheckoutFailedCard.svelte";
  import MarketplaceCheckoutFailedMobile from "$lib/components/checkout/MarketplaceCheckoutFailedMobile.svelte";

  export let badge = "PAYMENT FAILED";
  export let title = "";
  export let date = "";
  export let location = "";
  /** @type {string | null} */
  export let image = null;

  export let eventName = "";
  export let amountLabel = "";
  export let reason = "Insufficient balance or timeout";
  export let orderId = "";
  /** @type {() => void} */
  export let onTryAgain = () => {};
  /** @type {() => void} */
  export let onChooseMethod = () => {};
</script>

<!-- Mobile HI-FI 281:110 -->
<div class="h-full min-h-0 overflow-y-auto lg:hidden">
  <MarketplaceCheckoutFailedMobile
    {eventName}
    {amountLabel}
    {reason}
    {orderId}
    {onTryAgain}
    {onChooseMethod}
  />
</div>

<!-- Desktop HI-FI 787:1576 -->
<div
  class="hidden h-full min-h-0 flex-col lg:flex lg:flex-row lg:overflow-hidden"
>
  <CheckoutEventHero
    {badge}
    badgeVariant="danger"
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
      <MarketplaceCheckoutFailedCard
        {eventName}
        {amountLabel}
        {reason}
        {orderId}
        {onTryAgain}
        {onChooseMethod}
      />
    </div>
  </div>
</div>
