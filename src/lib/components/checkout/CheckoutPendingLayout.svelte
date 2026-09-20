<script>
  // @ts-nocheck
  /**
   * Unwired composition helper for HI-FI 55:521.
   * CheckoutEventHero + AuthPanelDecor + CheckoutPendingCard.
   */
  import AuthPanelDecor from "$lib/components/auth/AuthPanelDecor.svelte";
  import CheckoutEventHero from "$lib/components/checkout/CheckoutEventHero.svelte";
  import CheckoutPendingCard from "$lib/components/checkout/CheckoutPendingCard.svelte";

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
  export let subtitle =
    "Complete the prompt on your phone. You can close this page - the order will be created automatically.";
  /** @type {string[]} */
  export let steps = [];
  /** @type {string[]} */
  export let tips = [
    "If the payment takes longer than 2 minutes, try the code again. Ensure your Orange Money account has sufficient balance.",
    "If payment fails, check your PIN and balance. You can retry or contact support.",
  ];
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
    class="relative flex flex-1 items-start justify-center overflow-hidden bg-paper px-4 py-5 lg:w-1/2 lg:items-center lg:px-8 lg:py-6"
  >
    <AuthPanelDecor />
    <CheckoutPendingCard
      {ussdCode}
      {transactionRef}
      {carrier}
      {subtitle}
      {steps}
      {tips}
    />
  </div>
</div>
