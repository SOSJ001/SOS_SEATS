<script>
  // @ts-nocheck
  /**
   * Landing from HI-FI 55:8 desktop + 4:6 mobile (responsive).
   */
  import PublicIcon from "$lib/components/public/PublicIcon.svelte";
  import PublicEventCard from "$lib/components/public/PublicEventCard.svelte";
  import PublicUpcomingEmptyState from "$lib/components/public/PublicUpcomingEmptyState.svelte";
  import { sessionFromDb } from "$lib/store";
  import { goto } from "$app/navigation";

  export let data;

  const CATEGORIES = ["Music", "Tech", "Comedy", "Sports", "Workshops", "Food"];
  const HERO_IMG = "/hifi/hero.png";
  const HERO_FALLBACK =
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&h=900&fit=crop";

  let searchQuery = "";
  let activeCategory = "Music";
  let heroSrc = HERO_IMG;

  $: events = normalizeEvents(data?.events || []);
  $: upcoming = events.slice(0, 3);
  $: isLoggedIn = !!$sessionFromDb;

  function normalizeEvents(raw) {
    return (raw || []).map((row) => {
      if (row?.Event) {
        return {
          id: row.Event.id,
          name: row.Event.name,
          venue: row.Event.venue,
          date: row.Event.date || row.Event.event_date,
          category: row.Event.category,
          price: row.Event.ticket_price ?? row.Event.price,
          imageUrl: row.Image?.publicUrl || row.Image?.file_path,
          is_free_event: row.Event.is_free_event,
        };
      }
      return row;
    });
  }

  function goOrLogin(path) {
    if (isLoggedIn) goto(path);
    else goto(`/sign-in?next=${encodeURIComponent(path)}`);
  }

  function onSearch() {
    if (searchQuery.trim()) {
      goto(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      goto("/marketplace");
    }
  }

  function selectCategory(cat) {
    activeCategory = cat;
    goto(`/marketplace?category=${encodeURIComponent(cat)}`);
  }

  const btnPrimary =
    "bg-brand text-white font-extrabold border-0 cursor-pointer shadow-public-cta text-sm md:text-base rounded-[10px] md:rounded-[14px] px-3 py-2.5 md:px-8 md:py-4 w-full md:w-auto";
  const btnSecondary =
    "bg-paper text-brand font-extrabold border-[1.5px] border-brand cursor-pointer shadow-[0_8px_9px_rgba(18,4,28,0.08)] text-sm md:text-base rounded-[10px] md:rounded-[14px] px-3 py-2.5 md:px-8 md:py-4 w-full md:w-auto";
  const btnGhost =
    "inline-flex items-center bg-paper text-ink font-bold text-sm border border-paper-border rounded-[10px] md:rounded-xl px-[18px] py-2.5 md:px-6 md:py-3";
  const sectionPad = "px-5 py-10 md:px-20 md:py-12";
  const h2 = "m-0 font-display font-bold text-[22px] md:text-[clamp(28px,4vw,36px)] text-ink";
</script>

<svelte:head>
  <title>SOS SEATS - Event Ticketing Platform</title>
</svelte:head>

<!-- Hero (Figma 55:16 desktop / 4:19 mobile) -->
<section
  class="relative min-h-[490px] md:h-[486px] md:min-h-[486px] flex items-stretch overflow-hidden"
>
  <img
    class="absolute inset-0 w-full h-full object-cover"
    src={heroSrc}
    alt=""
    on:error={() => (heroSrc = HERO_FALLBACK)}
  />
  <div class="absolute inset-0 bg-public-hero-shade"></div>
  <div
    class="absolute top-24 left-0 right-0 h-0.5 bg-public-hero-accent shadow-hero-accent z-[1] hidden md:block"
    aria-hidden="true"
  ></div>
  <div
    class="relative z-[1] flex flex-col gap-5 md:gap-6 justify-end w-full px-6 py-10 md:px-20 md:pt-[120px] md:pb-20 bg-[rgba(18,4,28,0.45)] backdrop-blur-[4px]"
  >
    <h1
      class="m-0 font-display font-bold text-[clamp(28px,7vw,48px)] leading-[1.1] text-white max-w-[15ch]"
    >
      Live events across Sierra Leone.
    </h1>
    <div
      class="m-0 max-w-[640px] text-[15px] md:text-[clamp(15px,2vw,17px)] leading-[1.6] text-white/90 [text-shadow:0_2px_8px_rgba(0,0,0,0.25)]"
    >
      <p class="m-0 md:hidden">
        Concerts, comedy nights, tech meetups, and more - all in one place. Pay with Orange Money or
        Afrimoney.
      </p>
      <p class="m-0 hidden md:block">
        Concerts, comedy nights, tech meetups, and more - all in one place.
      </p>
      <p class="m-0 hidden md:block">
        Pay seamlessly with Orange Money or Afrimoney. Safe, fast, and local.
      </p>
    </div>
    <div class="grid grid-cols-2 gap-2.5 md:flex md:flex-wrap md:gap-4">
      <button
        type="button"
        class={btnPrimary}
        on:click={() => goOrLogin("/dashboard/events/createEvent")}
      >
        Create Events
      </button>
      <button type="button" class={btnSecondary} on:click={() => goto("/sign-up")}>
        Create an Account
      </button>
    </div>
    <div class="h-px w-full bg-white/25 md:hidden" aria-hidden="true"></div>
    <!-- Mobile stats (4:6) -->
    <div class="flex flex-wrap gap-2 md:hidden">
      <span
        class="inline-flex items-center bg-white/15 border border-white/25 backdrop-blur-sm text-white text-[11px] font-extrabold px-2.5 py-1.5 rounded-full"
      >
        2,500+ events
      </span>
      <span
        class="inline-flex items-center bg-white/15 border border-white/25 backdrop-blur-sm text-white text-[11px] font-extrabold px-2.5 py-1.5 rounded-full"
      >
        50k+ tickets
      </span>
      <span
        class="inline-flex items-center bg-white/15 border border-white/25 backdrop-blur-sm text-white text-[11px] font-extrabold px-2.5 py-1.5 rounded-full"
      >
        Secure payments
      </span>
    </div>
    <!-- Desktop stats (55:8) -->
    <div class="hidden md:flex flex-wrap gap-3">
      <span
        class="inline-flex items-center gap-2 bg-white/15 border border-white/25 backdrop-blur-sm text-white text-[13px] font-extrabold px-3.5 py-2.5 rounded-full"
      >
        <PublicIcon name="calendar" size={16} color="#fff" strokeWidth={2.5} />
        2,500+ events hosted
      </span>
      <span
        class="inline-flex items-center gap-2 bg-white/15 border border-white/25 backdrop-blur-sm text-white text-[13px] font-extrabold px-3.5 py-2.5 rounded-full"
      >
        <PublicIcon name="users" size={16} color="#fff" strokeWidth={2.5} />
        50k+ tickets sold
      </span>
      <span
        class="inline-flex items-center gap-2 bg-white/15 border border-white/25 backdrop-blur-sm text-white text-[13px] font-extrabold px-3.5 py-2.5 rounded-full"
      >
        <PublicIcon name="shield-check" size={16} color="#fff" strokeWidth={2.5} />
        Secure mobile money
      </span>
    </div>
  </div>
    </section>

<!-- Search strip (Figma 55:26 / 33:2) -->
<section class="px-5 py-6 md:px-20 md:py-8 flex flex-col gap-4">
  <div
    class="flex items-center gap-3 h-[44px] md:h-[52px] bg-paper border border-paper-border rounded-xl px-[18px] shadow-public-search"
  >
    <PublicIcon name="search" size={20} color="#9a92b3" />
    <input
      type="search"
      class="landing-search flex-1 border-0 outline-none text-base font-public text-ink bg-transparent placeholder:text-ink-muted shadow-none"
      placeholder="Search events, host names..."
      bind:value={searchQuery}
      on:keydown={(e) => e.key === "Enter" && onSearch()}
    />
    <button
      type="button"
      class="bg-brand text-white border-0 rounded-[10px] font-extrabold text-sm h-[30px] px-[18px] cursor-pointer shadow-public-cta"
      on:click={onSearch}
    >
      Search
    </button>
  </div>
  <div>
    <p class="m-0 mb-2.5 text-[11px] md:text-xs font-normal md:font-bold tracking-[0.33px] md:tracking-[0.24px] text-ink-muted">
      Browse by category
    </p>
    <div class="flex gap-2 md:gap-2.5 overflow-x-auto pb-0.5">
      {#each CATEGORIES as cat}
        <button
          type="button"
          class="shrink-0 border bg-paper rounded-full px-3 py-1.5 md:px-3.5 md:py-2 text-xs md:text-[13px] font-normal md:font-extrabold text-ink md:text-ink-secondary cursor-pointer {activeCategory ===
          cat
            ? 'border-[1.5px] border-brand'
            : 'border-paper-border'}"
          on:click={() => selectCategory(cat)}
        >
          {cat}
        </button>
      {/each}
    </div>
  </div>
    </section>

<!-- Upcoming (Figma 55:32 filled / 879:1936 empty) -->
<section class={sectionPad}>
  <div class="flex flex-col gap-1.5 mb-5">
    <div class="flex items-center justify-between gap-4">
      <h2 class={h2}>Upcoming Events</h2>
      {#if upcoming.length}
        <a href="/marketplace" class="text-brand text-sm font-extrabold whitespace-nowrap"
          >See All Events →</a
        >
      {/if}
    </div>
    {#if upcoming.length}
      <p class="m-0 text-ink-body text-sm leading-5">
        Don't miss what's happening near you
      </p>
    {:else}
      <p class="m-0 text-ink-body text-sm leading-5 md:hidden">
        No events scheduled yet - check back soon!
      </p>
      <p class="m-0 text-ink-body text-sm leading-5 hidden md:block">
        The stage is set - Sierra Leone's best events are coming soon.
      </p>
    {/if}
  </div>

  {#if upcoming.length}
    <div class="grid grid-cols-1 gap-4 min-[900px]:grid-cols-3">
      {#each upcoming as event (event.id || event.name)}
        <PublicEventCard {event} />
      {/each}
    </div>
  {:else}
    <PublicUpcomingEmptyState />
  {/if}
    </section>

<!-- How it works (Figma 55:35 desktop / 4:29 mobile) -->
<section class="{sectionPad} flex flex-col gap-6 bg-paper">
  <div class="flex flex-col gap-2">
    <h2 class={h2}>How It Works</h2>
    <p class="m-0 text-ink-muted md:text-ink-body text-[13px] md:text-base leading-5 md:leading-6 max-w-[720px]">
      A simple, 3-step process to find, buy, and enjoy your favorite events. No more paper tickets or
      long lines.
    </p>
  </div>

  <!-- Mobile numbered rows (4:6) -->
  <div class="flex flex-col gap-3 min-[900px]:hidden">
    <div
      class="bg-brand-wash border border-paper-border rounded-2xl p-4 shadow-public-step flex gap-3 items-center"
    >
      <div
        class="shrink-0 size-7 rounded-full bg-brand text-white text-base font-extrabold flex items-center justify-center"
      >
        1
      </div>
      <div class="flex flex-col gap-0.5 min-w-0">
        <h3 class="m-0 text-base font-bold text-ink">Browse events.</h3>
        <p class="m-0 text-ink-body text-sm leading-[1.4]">
          Set ticket tiers, prices in NLe, and configure options easily.
        </p>
      </div>
    </div>
    <div
      class="bg-brand-wash border border-paper-border rounded-2xl p-4 shadow-public-step flex gap-3 items-center"
    >
      <div
        class="shrink-0 size-7 rounded-full bg-brand text-white text-base font-extrabold flex items-center justify-center"
      >
        2
      </div>
      <div class="flex flex-col gap-0.5 min-w-0">
        <h3 class="m-0 text-base font-bold text-ink">Pay.</h3>
        <p class="m-0 text-ink-body text-sm leading-[1.4]">
          Orange Money or Afrimoney. Instantly settled local money.
        </p>
      </div>
    </div>
    <div
      class="bg-brand-wash border border-paper-border rounded-2xl p-4 shadow-public-step flex gap-3 items-center"
    >
      <div
        class="shrink-0 size-7 rounded-full bg-brand text-white text-base font-extrabold flex items-center justify-center"
      >
        3
      </div>
      <div class="flex flex-col gap-0.5 min-w-0">
        <h3 class="m-0 text-base font-bold text-ink">Show your QR.</h3>
        <p class="m-0 text-ink-body text-sm leading-[1.4]">
          Open My Tickets and tap Show entry QR at the door.
        </p>
      </div>
    </div>
  </div>

  <!-- Desktop icon cards (55:8) -->
  <div class="hidden min-[900px]:grid gap-4 items-center grid-cols-[1fr_auto_1fr_auto_1fr]">
    <div
      class="bg-brand-wash border border-paper-border rounded-2xl p-5 shadow-public-step flex flex-col gap-3"
    >
      <div class="w-10 h-10 rounded-[20px] bg-brand-soft flex items-center justify-center">
        <PublicIcon name="search" size={20} color="#ff5a1f" strokeWidth={2.5} />
      </div>
      <h3 class="m-0 text-xl font-extrabold">Browse events.</h3>
      <p class="m-0 text-ink-body text-sm leading-5">
        Set ticket tiers, prices in NLe, and configure options easily.
      </p>
    </div>
    <div class="w-6 h-6 flex items-center justify-center" aria-hidden="true">
      <PublicIcon name="arrow-right" size={18} color="#ff5a1f" strokeWidth={2} />
    </div>
    <div
      class="bg-accent-blue-wash border border-paper-border rounded-2xl p-5 shadow-public-step flex flex-col gap-3"
    >
      <div class="w-10 h-10 rounded-[20px] bg-accent-blue-soft flex items-center justify-center">
        <PublicIcon name="smartphone" size={20} color="#ff5a1f" strokeWidth={2.5} />
      </div>
      <h3 class="m-0 text-xl font-extrabold">Pay.</h3>
      <p class="m-0 text-ink-body text-sm leading-5">
        Orange Money or Afrimoney. Instantly settled local money.
      </p>
    </div>
    <div class="w-6 h-6 flex items-center justify-center" aria-hidden="true">
      <PublicIcon name="arrow-right" size={18} color="#ff5a1f" strokeWidth={2} />
    </div>
    <div
      class="bg-accent-green-wash border border-paper-border rounded-2xl p-5 shadow-public-step flex flex-col gap-3"
    >
      <div class="w-10 h-10 rounded-[20px] bg-accent-green-soft flex items-center justify-center">
        <PublicIcon name="qr-code" size={20} color="#ff5a1f" strokeWidth={2.5} />
      </div>
      <h3 class="m-0 text-xl font-extrabold">Show your QR.</h3>
      <p class="m-0 text-ink-body text-sm leading-5">
        Open My Tickets and tap Show entry QR at the door.
      </p>
    </div>
  </div>

  <div class="flex flex-col gap-2.5 md:gap-3 w-full">
    <h3 class="m-0 text-lg md:text-xl font-display md:font-extrabold font-bold">
      Your tickets, always with you.
    </h3>
    <p class="m-0 text-ink-muted md:text-ink-body text-[13px] md:text-sm leading-5 md:leading-[22px] max-w-[720px]">
      Once you've completed your purchase, your tickets are instantly available in the My Tickets
      section of your app. You can share them with friends or access them offline.
    </p>
    <div class="flex flex-wrap gap-2.5 md:gap-2 items-start">
      <button
        type="button"
        class="bg-brand text-white font-bold md:font-extrabold text-[13px] md:text-sm border-0 rounded-[10px] md:rounded-xl px-[18px] py-2.5 md:px-6 md:py-3 cursor-pointer shadow-none"
        on:click={() => goOrLogin("/dashboard/my-tickets")}
      >
        View My Tickets
      </button>
      <a href="/marketplace" class={btnGhost}>Learn More</a>
    </div>
  </div>
    </section>

<!-- Trust + fees (Figma 55:53 desktop / 4:50+4:77 mobile) -->
<section
  id="fees"
  class="grid gap-8 md:gap-10 bg-public-trust-fees px-5 py-10 md:p-20 min-[900px]:grid-cols-2"
>
  <div class="flex flex-col gap-3 md:gap-6 min-w-0">
    <div class="flex items-center gap-3">
      <span
        class="inline-flex w-11 h-11 items-center justify-center rounded-[14px] bg-brand-soft shadow-public-badge"
        aria-hidden="true"
      >
        <PublicIcon name="shield-check" size={22} color="#ff5a1f" />
      </span>
      <h2 class={h2}>Trust</h2>
    </div>
    <div class="flex flex-col gap-3 md:gap-4">
      <div
        class="bg-brand-wash border border-paper-border rounded-xl md:rounded-2xl px-4 py-3.5 md:p-5 shadow-public-step flex gap-3 items-start"
      >
        <div
          class="size-8 md:size-10 shrink-0 rounded-2xl md:rounded-xl bg-brand-soft flex items-center justify-center"
        >
          <PublicIcon name="wallet" size={16} color="#ff5a1f" />
        </div>
        <div class="flex flex-col gap-1 min-w-0">
          <h3 class="m-0 text-[15px] md:text-lg font-bold md:font-extrabold">Mobile money</h3>
          <p class="m-0 text-ink-body text-[13px] md:text-sm leading-[1.4] md:leading-5">
            Pay seamlessly with Orange Money or Afrimoney.
          </p>
        </div>
      </div>
      <div
        class="bg-accent-blue-wash md:bg-accent-blue-wash border border-paper-border rounded-xl md:rounded-2xl px-4 py-3.5 md:p-5 shadow-public-step flex gap-3 items-start"
      >
        <div
          class="size-8 md:size-10 shrink-0 rounded-2xl md:rounded-xl bg-brand-soft md:bg-accent-blue-soft flex items-center justify-center"
        >
          <PublicIcon name="qr-code" size={16} color="#ff5a1f" />
        </div>
        <div class="flex flex-col gap-1 min-w-0">
          <h3 class="m-0 text-[15px] md:text-lg font-bold md:font-extrabold">QR tickets</h3>
          <p class="m-0 text-ink-body text-[13px] md:text-sm leading-[1.4] md:leading-5">
            Instantly delivered to your phone.
          </p>
        </div>
      </div>
      <div
        class="bg-accent-green-wash border border-paper-border rounded-xl md:rounded-2xl px-4 py-3.5 md:p-5 shadow-public-step flex gap-3 items-start"
      >
        <div
          class="size-8 md:size-10 shrink-0 rounded-2xl md:rounded-xl bg-brand-soft md:bg-accent-green-soft flex items-center justify-center"
        >
          <PublicIcon name="shield-check" size={16} color="#ff5a1f" />
        </div>
        <div class="flex flex-col gap-1 min-w-0">
          <h3 class="m-0 text-[15px] md:text-lg font-bold md:font-extrabold">Proceeds Guarantee</h3>
          <p class="m-0 text-ink-body text-[13px] md:text-sm leading-[1.4] md:leading-5">
            Organiser proceeds are securely processed after they clear.
          </p>
        </div>
      </div>
    </div>
  </div>

  <div class="flex flex-col gap-3 md:gap-6 min-w-0">
    <div class="flex flex-col gap-3 w-full">
      <div class="flex items-center gap-3">
        <span
          class="inline-flex w-11 h-11 items-center justify-center rounded-[14px] bg-brand-soft shadow-public-badge"
          aria-hidden="true"
        >
          <PublicIcon name="shield-check" size={22} color="#ff5a1f" />
        </span>
        <h2 class={h2}>Transparent Fees</h2>
      </div>
      <p class="m-0 text-[13px] md:text-base leading-6 text-ink-secondary">
        No hidden charges. What you see is what you pay.
      </p>
    </div>

    <!-- Mobile compact fee rows (4:77) -->
    <div class="flex flex-col gap-2.5 min-[900px]:hidden border border-slate-200 rounded-lg overflow-hidden">
      <div
        class="bg-paper relative flex items-center gap-3 px-4 py-3.5 shadow-public-fee before:content-[''] before:absolute before:left-4 before:top-3.5 before:bottom-3.5 before:w-1 before:bg-brand before:rounded"
      >
        <div class="ml-3 size-7 shrink-0 rounded-[14px] bg-brand-soft flex items-center justify-center">
          <PublicIcon name="store" size={14} color="#ff5a1f" />
        </div>
        <span class="text-sm font-bold text-ink shrink-0">Organiser</span>
        <div class="ml-auto flex items-center gap-1 whitespace-nowrap">
          <span class="text-base font-extrabold text-brand">5%</span>
          <span class="text-[13px] text-ink-body">of face value at sale</span>
        </div>
      </div>
      <div
        class="bg-paper relative flex items-center gap-3 px-4 py-3.5 shadow-public-fee before:content-[''] before:absolute before:left-4 before:top-3.5 before:bottom-3.5 before:w-1 before:bg-brand before:rounded"
      >
        <div class="ml-3 size-7 shrink-0 rounded-[14px] bg-brand-soft flex items-center justify-center">
          <PublicIcon name="ticket" size={14} color="#ff5a1f" />
        </div>
        <span class="text-sm font-bold text-ink shrink-0">Buyer</span>
        <div class="ml-auto flex items-center gap-1 whitespace-nowrap">
          <span class="text-base font-extrabold text-brand">0.99%</span>
          <span class="text-[13px] text-ink-body">booking fee on face value</span>
        </div>
      </div>
      <div
        class="bg-paper relative flex items-center gap-3 px-4 py-3.5 shadow-public-fee before:content-[''] before:absolute before:left-4 before:top-2 before:bottom-2 before:w-1 before:bg-brand before:rounded"
      >
        <div class="ml-3 size-7 shrink-0 rounded-[14px] bg-brand-soft flex items-center justify-center">
          <PublicIcon name="user" size={14} color="#ff5a1f" />
        </div>
        <span class="text-sm font-bold text-ink shrink-0">Attendee</span>
        <div class="ml-auto flex items-center gap-1 whitespace-nowrap">
          <span class="text-base font-extrabold text-brand">0%</span>
          <span class="text-[13px] text-ink-body">no extra fees for free events</span>
        </div>
      </div>
</div>

    <!-- Desktop large fee cards (55:8) -->
    <div
      class="hidden min-[900px]:flex flex-col gap-4 bg-brand-wash border border-paper-border rounded-2xl p-6 shadow-public-card"
    >
      <div
        class="bg-paper relative overflow-hidden rounded-xl p-5 pl-6 shadow-public-fee flex items-center justify-between gap-3 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-brand before:rounded-l-xl"
      >
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
            <PublicIcon name="store" size={22} color="#ff5a1f" />
          </div>
          <div class="flex flex-col gap-1.5">
            <strong class="text-[15px] font-extrabold">Organiser</strong>
            <span class="text-sm text-ink-body">5% of face value at sale</span>
          </div>
        </div>
        <div class="text-[40px] font-extrabold text-right leading-[44px] text-brand">
          5%<small class="block text-[13px] font-normal leading-tight text-ink-secondary">fee</small>
        </div>
      </div>
      <div
        class="bg-paper relative overflow-hidden rounded-xl p-5 pl-6 shadow-public-fee flex items-center justify-between gap-3 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-accent-blue before:rounded-l-xl"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-11 h-11 rounded-xl bg-accent-blue-soft flex items-center justify-center shrink-0"
          >
            <PublicIcon name="ticket" size={22} color="#3b82f6" />
          </div>
          <div class="flex flex-col gap-1.5">
            <strong class="text-[15px] font-extrabold">Buyer</strong>
            <span class="text-sm text-ink-body">0.99% booking fee on ticket</span>
          </div>
        </div>
        <div class="text-[40px] font-extrabold text-right leading-[44px] text-brand">
          0.99%<small class="block text-[13px] font-normal leading-tight text-ink-secondary"
            >fee</small
          >
        </div>
      </div>
      <div
        class="bg-paper relative overflow-hidden rounded-xl p-5 pl-6 shadow-public-fee flex items-center justify-between gap-3 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-accent-green before:rounded-l-xl"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-11 h-11 rounded-xl bg-accent-green-soft flex items-center justify-center shrink-0"
          >
            <PublicIcon name="user" size={22} color="#10b981" />
          </div>
          <div class="flex flex-col gap-1.5">
            <strong class="text-[15px] font-extrabold">Attendee</strong>
            <span class="text-sm text-ink-body">No extra fees for free events</span>
          </div>
        </div>
        <div class="text-[40px] font-extrabold text-right leading-[44px] text-brand">
          0%<small class="block text-[13px] font-normal leading-tight text-ink-secondary">fee</small>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .landing-search:focus,
  .landing-search:focus-visible,
  .landing-search:active {
    outline: none !important;
    border-color: transparent !important;
    box-shadow: none !important;
    --tw-ring-color: transparent !important;
    --tw-ring-shadow: 0 0 #0000 !important;
    --tw-ring-offset-shadow: 0 0 #0000 !important;
  }
</style>
