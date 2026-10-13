<script>
  // @ts-nocheck
  /**
   * Checkout account choice (roadmap 5.8) - mobile 1397:5083 / desktop 1397:5132.
   * Guests land here from checkout or claim; auth returns them via `next`.
   */
  import ArrowLeft from "lucide-svelte/icons/arrow-left";
  import { authSearchParams } from "$lib/auth/postAuthRedirect.js";
  import { formatHeroDateTime } from "$lib/utils/formatHeroDateTime.js";
  import AuthPanelDecor from "$lib/components/auth/AuthPanelDecor.svelte";
  import AuthWordmark from "$lib/components/auth/AuthWordmark.svelte";
  import CheckoutEventHero from "$lib/components/checkout/CheckoutEventHero.svelte";
  import CheckoutAccountChoiceCard from "$lib/components/checkout/CheckoutAccountChoiceCard.svelte";

  export let data;

  $: event = data.event;
  $: intent = data.intent;
  $: authQuery = authSearchParams({ next: data.target, role: "attendee" });
  $: createHref = `/sign-up/phone${authQuery}`;
  $: signInHref = `/sign-in/phone${authQuery}`;
  $: eventHref = `/marketplace/eventDetails/${event.id}`;
  $: heroDateTime = formatHeroDateTime(event.dateRaw, event.time);
  $: heroVenue = (event.location || event.venue || "").trim();
  $: pageTitle = intent === "claim" ? "Continue claim" : "Continue checkout";
</script>

<svelte:head>
  <title>{pageTitle} · {event.name} · SOS SEATS</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-paper-cream lg:h-full lg:flex-row lg:bg-transparent">
  <div class="hidden lg:contents">
    <CheckoutEventHero
      title={event.name}
      date={heroDateTime}
      location={heroVenue}
      image={event.image}
    />
  </div>

  <div
    class="relative flex flex-1 flex-col lg:w-1/2 lg:items-center lg:justify-center lg:overflow-y-auto lg:bg-paper lg:px-8 lg:py-6"
  >
    <div class="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
      <AuthPanelDecor />
    </div>

    <div
      class="relative z-10 flex w-full flex-col gap-5 px-6 pb-6 pt-0 lg:max-w-[440px] lg:gap-4 lg:px-0 lg:py-0"
    >
      <div class="flex h-[60px] items-center justify-between gap-3 lg:h-auto">
        <AuthWordmark />
        <a
          href={eventHref}
          class="inline-flex items-center gap-1.5 text-[13px] text-ink-secondary no-underline hover:text-ink lg:text-[12px]"
        >
          <ArrowLeft size={16} />
          Back to event
        </a>
      </div>

      <CheckoutAccountChoiceCard {intent} {createHref} {signInHref} />
    </div>
  </div>
</div>
