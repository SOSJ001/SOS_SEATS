<script>
  // @ts-nocheck
  /**
   * Desktop marketplace from HI-FI 55:109. Tailwind utilities + theme tokens.
   */
  import PublicEventCard from "$lib/components/public/PublicEventCard.svelte";
  import PublicIcon from "$lib/components/public/PublicIcon.svelte";
  import PublicMarketplaceEmptyState from "$lib/components/public/PublicMarketplaceEmptyState.svelte";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { loadPublicEvents } from "$lib/supabase.js";

  export let data;

  const FILTER_CHIPS = [
    "This Weekend",
    "Music",
    "Comedy",
    "Freetown",
    "Bo",
    "Kenema",
    "Makeni",
  ];

  const LOCATIONS = [
    "All Western Area",
    "Lumley & Aberdeen",
    "Wilberforce",
    "Central Freetown",
    "Upcountry",
  ];

  const PRICE_OPTIONS = [
    "Any Price",
    "Free Events",
    "Under NLe 100",
    "NLe 100 - NLe 500",
    "NLe 500+",
  ];

  const DATE_OPTIONS = [
    "Any Date",
    "Today",
    "This Weekend",
    "This Week",
    "This Month",
    "Custom Range",
  ];

  function isFree(event) {
    const price = event?.price;
    return (
      event?.is_free_event ||
      price === 0 ||
      price === "Free" ||
      price === "0" ||
      price === "NLe 0" ||
      (typeof price === "string" &&
        (price.toLowerCase().includes("free") ||
          price.toLowerCase().includes("nle 0")))
    );
  }

  function normalize(raw) {
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
      return { ...row, is_free_event: isFree(row) };
    });
  }

  function chipFromCategory(category) {
    if (!category) return null;
    return (
      FILTER_CHIPS.find((chip) => chip.toLowerCase() === category.toLowerCase()) ||
      null
    );
  }

  let searchQuery = $page.url.searchParams.get("q") || "";
  let activeChip =
    chipFromCategory($page.url.searchParams.get("category")) || "This Weekend";
  let selectedLocations = ["All Western Area"];
  let selectedPrice = "Any Price";
  let selectedDate = "Any Date";
  let allEvents = normalize(data?.marketplaceEvent || []);
  let loading = !allEvents.length;

  onMount(async () => {
    const q = $page.url.searchParams.get("q");
    if (q) searchQuery = q;

    const categoryChip = chipFromCategory($page.url.searchParams.get("category"));
    if (categoryChip) activeChip = categoryChip;
    else {
      const category = $page.url.searchParams.get("category");
      if (category && !searchQuery) searchQuery = category;
    }

    if (allEvents.length) {
      loading = false;
      return;
    }

    loading = true;
    try {
      const events = await loadPublicEvents();
      allEvents = (events || []).map((event) => ({
        ...event,
        is_free_event: isFree(event),
      }));
    } catch (e) {
      console.error(e);
      allEvents = [];
    } finally {
      loading = false;
    }
  });

  $: filtered = allEvents.filter((event) => {
    const q = searchQuery.trim().toLowerCase();
    const name = (event.name || "").toLowerCase();
    const venue = (event.venue || "").toLowerCase();
    const cat = (event.category || "").toLowerCase();
    const matchesSearch =
      !q || name.includes(q) || venue.includes(q) || cat.includes(q);

    let matchesChip = true;
    if (activeChip && activeChip !== "This Weekend") {
      const chip = activeChip.toLowerCase();
      matchesChip =
        cat.includes(chip) || venue.includes(chip) || name.includes(chip);
    }

    let matchesPrice = true;
    if (selectedPrice === "Free Events") matchesPrice = !!event.is_free_event;
    else if (selectedPrice === "Under NLe 100") {
      const n = Number(event.price);
      matchesPrice = !Number.isNaN(n) && n < 100;
    } else if (selectedPrice === "NLe 100 - NLe 500") {
      const n = Number(event.price);
      matchesPrice = !Number.isNaN(n) && n >= 100 && n <= 500;
    } else if (selectedPrice === "NLe 500+") {
      const n = Number(event.price);
      matchesPrice = !Number.isNaN(n) && n >= 500;
    }

    return matchesSearch && matchesChip && matchesPrice;
  });

  $: displayEvents = filtered;
  $: upcoming = displayEvents.slice(0, 6);
  $: popular = displayEvents.slice(0, 6).reverse();

  function toggleLocation(loc) {
    if (loc === "All Western Area") {
      selectedLocations = ["All Western Area"];
      return;
    }
    selectedLocations = selectedLocations.filter((l) => l !== "All Western Area");
    if (selectedLocations.includes(loc)) {
      selectedLocations = selectedLocations.filter((l) => l !== loc);
    } else {
      selectedLocations = [...selectedLocations, loc];
    }
    if (!selectedLocations.length) selectedLocations = ["All Western Area"];
  }
</script>

<svelte:head>
  <title>Marketplace - SOS SEATS</title>
</svelte:head>

<div class="bg-paper-cream font-public text-ink">
  <section class="bg-paper pt-4 px-5 pb-0 md:pt-14 md:px-20 md:pb-8">
    <h1
      class="m-0 font-display text-xl font-bold leading-[1.2] text-ink md:text-[clamp(26px,4vw,40px)] md:font-extrabold md:leading-[1.1]"
    >
      Discover Events in Sierra Leone
    </h1>
    <p class="mt-2 mb-0 max-w-[720px] text-[13px] leading-5 text-[#9991b2] md:hidden">
      Find concerts, comedy nights, tech summits, and more happening in Freetown and beyond.
    </p>
    <p
      class="mt-3 mb-0 hidden max-w-[720px] text-base leading-normal text-ink-secondary md:block"
    >
      Find concerts, comedy nights, tech summits, and more happening in Freetown and beyond. Search
      by event, host, or location.
    </p>

    <div
      class="mt-4 flex h-11 items-center gap-2 border border-paper-border bg-paper px-4 rounded-lg md:mt-6 md:h-auto md:gap-3 md:rounded-xl md:px-[18px] md:py-3.5 md:shadow-public-search"
    >
      <span class="md:hidden">
        <PublicIcon name="search" size={16} color="#9a92b3" />
      </span>
      <span class="hidden md:inline-flex">
        <PublicIcon name="search" size={20} color="#9a92b3" />
      </span>
      <input
        type="search"
        placeholder="Search events, host names..."
        bind:value={searchQuery}
        class="marketplace-search flex-1 border-0 outline-none bg-transparent text-sm font-public text-ink placeholder:text-ink-muted shadow-none md:text-base"
      />
    </div>

    <div class="mt-3 flex gap-2 overflow-x-auto pb-[18px] md:mt-4 md:gap-2.5 md:pb-1">
      {#each FILTER_CHIPS as chip}
        <button
          type="button"
          class="shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors md:px-5 md:py-2.5 md:text-sm md:font-semibold {activeChip ===
          chip
            ? 'bg-brand text-white border border-brand md:shadow-[0_4px_12px_-2px_rgba(255,90,31,0.2)]'
            : 'bg-paper text-ink border border-paper-border md:border-[1.5px]'}"
          on:click={() => (activeChip = activeChip === chip ? "" : chip)}
        >
          {chip}
        </button>
      {/each}
    </div>
  </section>

  <div
    class="grid gap-6 px-5 pb-12 pt-0 md:grid-cols-[195px_1fr] md:gap-10 md:px-20 md:pb-16 md:pt-6"
  >
    <aside
      class="hidden md:flex flex-col gap-6 self-start w-[195px] bg-paper border border-paper-border rounded-2xl p-6 shadow-[0_10px_14px_rgba(15,23,42,0.04)]"
      aria-label="Filters"
    >
      <div class="flex flex-col gap-3">
        <h3 class="m-0 text-sm font-extrabold text-ink">Location</h3>
        {#each LOCATIONS as loc}
          <label class="flex items-center gap-2 text-[13px] text-ink-body cursor-pointer">
            <input
              type="checkbox"
              class="filter-control appearance-none shrink-0 size-4 rounded-[4px] border border-paper-border bg-transparent checked:bg-brand cursor-pointer"
              checked={selectedLocations.includes(loc)}
              on:change={() => toggleLocation(loc)}
            />
            {loc}
          </label>
        {/each}
      </div>

      <div class="flex flex-col gap-3">
        <h3 class="m-0 text-sm font-extrabold text-ink">Price Range</h3>
        {#each PRICE_OPTIONS as opt}
          <label class="flex items-center gap-2 text-[13px] text-ink-body cursor-pointer">
            <input
              type="radio"
              name="price"
              value={opt}
              bind:group={selectedPrice}
              class="filter-control appearance-none shrink-0 size-4 rounded-full border border-paper-border bg-transparent checked:bg-brand checked:border-brand cursor-pointer"
            />
            {opt}
          </label>
        {/each}
      </div>

      <div class="flex flex-col gap-3">
        <h3 class="m-0 text-sm font-extrabold text-ink">Date</h3>
        {#each DATE_OPTIONS as opt}
          <label class="flex items-center gap-2 text-[13px] text-ink-body cursor-pointer">
            <input
              type="radio"
              name="date"
              value={opt}
              bind:group={selectedDate}
              class="filter-control appearance-none shrink-0 size-4 rounded-full border border-paper-border bg-transparent checked:bg-brand checked:border-brand cursor-pointer"
            />
            {opt}
          </label>
        {/each}
      </div>
    </aside>

    <div class="min-w-0 flex flex-col gap-10">
      {#if loading && !allEvents.length}
        <p class="m-0 text-ink-secondary">Loading events…</p>
      {:else if !allEvents.length}
        <section>
          <h2
            class="m-0 mb-4 font-display text-[22px] font-bold text-ink md:text-xl md:font-extrabold"
          >
            Upcoming Events
          </h2>
          <PublicMarketplaceEmptyState />
        </section>
      {:else if !filtered.length}
        <div
          class="bg-paper border border-paper-border rounded-[20px] px-7 py-10 text-center"
        >
          <h2 class="m-0 mb-2 text-2xl font-extrabold text-ink">
            No events match right now
          </h2>
          <p class="mx-auto mb-5 max-w-[420px] text-ink-secondary">
            Try clearing filters or check back soon. Organisers across Sierra
            Leone are listing concerts, comedy, and more.
          </p>
          <button
            type="button"
            class="inline-block bg-brand text-white font-bold px-5 py-3 rounded-xl shadow-public-cta border-0 cursor-pointer"
            on:click={() => {
              searchQuery = "";
              activeChip = "This Weekend";
              selectedPrice = "Any Price";
              selectedDate = "Any Date";
              selectedLocations = ["All Western Area"];
            }}
          >
            Clear filters
          </button>
        </div>
      {:else}
        <section>
          <div class="flex items-baseline justify-between mb-4">
            <h2 class="m-0 font-display text-[22px] font-bold text-ink md:text-xl md:font-extrabold">
              Upcoming Events
            </h2>
            <span class="hidden text-sm font-bold text-brand md:inline">View all</span>
          </div>
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {#each upcoming as event (event.id || event.name)}
              <PublicEventCard {event} />
            {/each}
          </div>
        </section>

        {#if popular.length}
          <section class="hidden md:block">
            <div class="flex items-baseline justify-between mb-4">
              <h2 class="m-0 text-xl font-extrabold text-ink">
                Popular This Month
              </h2>
              <span class="text-sm font-bold text-brand">View all</span>
            </div>
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {#each popular as event (event.id || event.name)}
                <PublicEventCard {event} />
              {/each}
            </div>
          </section>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  /* Kill Flowbite blue focus ring (#1C64F2) on marketplace controls */
  .filter-control:focus,
  .filter-control:focus-visible,
  .filter-control:active,
  .marketplace-search:focus,
  .marketplace-search:focus-visible,
  .marketplace-search:active {
    outline: none !important;
    border-color: transparent !important;
    box-shadow: none !important;
    --tw-ring-color: transparent !important;
    --tw-ring-shadow: 0 0 #0000 !important;
    --tw-ring-offset-shadow: 0 0 #0000 !important;
  }
</style>
