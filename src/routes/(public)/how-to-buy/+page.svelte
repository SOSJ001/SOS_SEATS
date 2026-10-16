<script>
  // @ts-nocheck
  /**
   * How to buy — desktop HI-FI 1664:5378 / mobile 1663:5333.
   */
  import HowToBuyStep from "$lib/components/public/HowToBuyStep.svelte";
  import { sessionFromDb } from "$lib/store";
  import { signInHref } from "$lib/auth/postAuthRedirect.js";

  $: isLoggedIn = !!$sessionFromDb;
  $: ticketsHref = isLoggedIn
    ? "/dashboard/my-tickets"
    : signInHref("/dashboard/my-tickets", "attendee");

  const steps = [
    {
      title: "Browse events",
      shortBody: "Open Marketplace and pick an event.",
      longBody:
        "Open Marketplace and pick an event. Browse upcoming shows in Freetown and beyond, then tap into the event you want.",
      desktopSrc: "/how-to-buy/d-step-1.png",
      mobileSrc: "/how-to-buy/m-step-1.png",
    },
    {
      title: "Choose tickets",
      shortBody: "Select type and quantity, then Buy.",
      longBody:
        "Select type and quantity, then continue. Choose General, VIP, or other ticket types, set how many you need, and click Buy.",
      desktopSrc: "/how-to-buy/d-step-2.png",
      mobileSrc: "/how-to-buy/m-step-2.png",
    },
    {
      title: "Sign in or continue",
      shortBody: "Use your account so tickets land in My Tickets.",
      longBody:
        "Use your account so tickets land in My Tickets. Create an account or sign in so your passes are saved and ready when you arrive.",
      desktopSrc: "/how-to-buy/d-step-3.png",
      mobileSrc: "/how-to-buy/m-step-3.png",
    },
    {
      title: "Pay with mobile money",
      shortBody:
        "Enter your Orange Money or Afrimoney number and generate a payment code.",
      longBody:
        "Enter your Orange Money or Afrimoney number and generate a payment code. Confirm the phone to charge, then generate the code you will use to pay.",
      desktopSrc: "/how-to-buy/d-step-4.png",
      mobileSrc: "/how-to-buy/m-step-4.png",
    },
    {
      title: "Confirm on your phone",
      shortBody:
        "Approve the charge in your wallet app, then wait while we confirm payment.",
      longBody:
        "Approve the charge in your wallet app, then wait while we confirm payment. Dial the USSD code on your phone, approve the payment, and stay on this screen until it completes.",
      desktopSrc: "/how-to-buy/d-step-5.png",
      mobileSrc: "/how-to-buy/m-step-5.png",
    },
    {
      title: "Get your ticket",
      shortBody: "Open My Tickets for your QR pass.",
      longBody:
        "Open My Tickets for your QR pass. When payment is confirmed, your ticket and entry QR are waiting in My Tickets.",
      desktopSrc: "/how-to-buy/d-step-6.png",
      mobileSrc: "/how-to-buy/m-step-6.png",
      ticketsHref: true,
    },
  ];
</script>

<svelte:head>
  <title>How to buy · SOS SEATS</title>
  <meta
    name="description"
    content="Buy SOS SEATS tickets with Orange Money or Afrimoney in a few steps."
  />
</svelte:head>

<main class="w-full px-5 py-8 md:px-20 md:py-12">
  <div class="mx-auto flex w-full max-w-[880px] flex-col">
    <header class="mb-2 lg:mb-4">
      <div class="mb-3 hidden h-1 w-8 rounded-sm bg-brand lg:mb-3 lg:block" aria-hidden="true"></div>
      <h1 class="m-0 font-display text-[28px] font-bold leading-tight text-ink lg:text-[40px]">
        How to buy
      </h1>
      <p class="m-0 mt-2 text-sm text-ink-muted lg:mt-2.5 lg:text-base">
        Buy tickets with Orange Money or Afrimoney.
      </p>
    </header>

    <div class="mt-4 lg:mt-6">
      {#each steps as step, i}
        <HowToBuyStep
          n={i + 1}
          title={step.title}
          shortBody={step.shortBody}
          longBody={step.longBody}
          desktopSrc={step.desktopSrc}
          mobileSrc={step.mobileSrc}
          showDivider={i < steps.length - 1}
          ticketsHref={step.ticketsHref ? ticketsHref : ""}
        />
      {/each}
    </div>

    <div class="mt-8 lg:mt-10">
      <a
        href="/marketplace"
        class="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-brand px-6 text-[15px] font-bold text-white hover:opacity-95 lg:h-12 lg:w-[280px]"
      >
        Browse events
      </a>
    </div>
  </div>
</main>
