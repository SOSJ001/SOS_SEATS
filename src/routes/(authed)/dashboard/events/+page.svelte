<script>
  // @ts-nocheck
  /**
   * Organiser events list (HI-FI 55:965 desktop, 4:651 mobile; empty 1627:5191 / 1627:5463).
   */
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import Calendar from "lucide-svelte/icons/calendar";
  import Check from "lucide-svelte/icons/check";
  import SquarePen from "lucide-svelte/icons/square-pen";
  import X from "lucide-svelte/icons/x";
  import Search from "lucide-svelte/icons/search";
  import SearchX from "lucide-svelte/icons/search-x";
  import Plus from "lucide-svelte/icons/plus";
  import ShareEventModal from "$lib/components/ShareEventModal.svelte";
  import EventsStatTile from "$lib/components/organizer/events/EventsStatTile.svelte";
  import EventsFilterChips from "$lib/components/organizer/events/EventsFilterChips.svelte";
  import OrganiserEventCard from "$lib/components/organizer/events/OrganiserEventCard.svelte";
  import RecentEventsEmpty from "$lib/components/organizer/events/RecentEventsEmpty.svelte";
  import {
    mapOrganiserEvent,
    isActiveStatus,
  } from "$lib/components/organizer/events/mapOrganiserEvent.js";

  const FILTERS = [
    { id: "all", label: "All" },
    { id: "published", label: "Published" },
    { id: "draft", label: "Draft" },
    { id: "cancelled", label: "Cancelled" },
  ];

  let events = [];
  let isLoading = true;
  let error = null;
  let searchQuery = "";
  let activeFilter = "all";

  let showShareModal = false;
  let selectedEventForSharing = null;

  $: organiserName = $page.data?.userName || "";

  onMount(loadEvents);

  async function loadEvents() {
    try {
      isLoading = true;
      error = null;
      const response = await fetch("/loadUserEventsApi");
      const result = await response.json();
      if (result.success) {
        events = (result.events || []).map(mapOrganiserEvent);
      } else {
        error = result.error || "Failed to load events";
      }
    } catch {
      error = "Failed to load events";
    } finally {
      isLoading = false;
    }
  }

  const isActive = isActiveStatus;

  function matchesFilter(status, filter) {
    if (filter === "published") return isActive(status);
    if (filter === "draft") return status === "draft";
    if (filter === "cancelled") return status === "cancelled";
    return true;
  }

  $: counts = {
    total: events.length,
    active: events.filter((e) => isActive(e.status)).length,
    draft: events.filter((e) => e.status === "draft").length,
    ended: events.filter((e) => e.status === "cancelled" || e.status === "completed").length,
  };

  $: query = searchQuery.trim().toLowerCase();
  $: filteredEvents = events.filter(
    (e) =>
      matchesFilter(e.status, activeFilter) &&
      (!query || (e.title || "").toLowerCase().includes(query))
  );

  function clearFilters() {
    searchQuery = "";
    activeFilter = "all";
  }

  function shareEvent(event) {
    selectedEventForSharing = event;
    showShareModal = true;
  }

  function closeShareModal() {
    showShareModal = false;
    selectedEventForSharing = null;
  }
</script>

<div class="flex flex-col gap-6 pb-24 lg:pb-0" in:fade={{ duration: 200 }}>
  {#if error}
    <div
      class="flex flex-col items-center gap-3 rounded-xl border border-paper-border bg-paper p-8 text-center shadow-public-card"
    >
      <p class="m-0 text-[15px] font-bold text-ink">We couldn't load your events</p>
      <p class="m-0 text-[13px] text-ink-secondary">{error}</p>
      <button
        type="button"
        class="cursor-pointer rounded-[10px] bg-brand px-5 py-2.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90"
        on:click={loadEvents}
      >
        Try Again
      </button>
    </div>
  {:else}
    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {#if isLoading}
        {#each Array(4) as _}
          <div class="h-20 animate-pulse rounded-xl bg-paper-border/60 lg:h-24 lg:rounded-2xl"></div>
        {/each}
      {:else}
        <EventsStatTile label="Total events" value={counts.total} sub="Across all statuses" icon={Calendar} tone="brand" />
        <EventsStatTile label="Active" value={counts.active} sub="Live & selling" icon={Check} tone="success" />
        <EventsStatTile label="Draft" value={counts.draft} sub="Needs publishing" icon={SquarePen} tone="warning" />
        <EventsStatTile label="Cancelled" value={counts.ended} sub="Ended / archived" icon={X} tone="error" />
      {/if}
    </div>

    <!-- Search + chips (mobile: chips first; desktop: search row first) -->
    <div class="flex flex-col gap-4">
      <div class="order-2 flex items-center justify-between gap-4 lg:order-1">
        <label
          class="flex w-full items-center gap-2.5 rounded-lg border border-paper-border bg-paper px-4 py-3 lg:w-[420px] lg:rounded-xl lg:border-transparent lg:shadow-public-card"
        >
          <Search class="size-[18px] shrink-0 text-ink-muted" aria-hidden="true" />
          <span class="sr-only">Filter events by name</span>
          <input
            type="search"
            bind:value={searchQuery}
            placeholder="Filter events by name..."
            class="w-full min-w-0 border-0 bg-transparent p-0 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-0"
          />
        </label>
        <a
          href="/dashboard/events/createEvent"
          class="hidden shrink-0 items-center gap-2 rounded-full bg-brand px-6 py-3 text-[14px] font-bold text-white no-underline transition-opacity hover:opacity-90 lg:flex"
        >
          <Plus class="size-4" aria-hidden="true" />
          Create Event
        </a>
      </div>
      <div class="order-1 lg:order-2">
        <EventsFilterChips
          options={FILTERS}
          active={activeFilter}
          on:change={(e) => (activeFilter = e.detail)}
        />
      </div>
    </div>

    <!-- Events -->
    {#if isLoading}
      <div
        class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 lg:rounded-xl lg:border lg:border-paper-border lg:bg-paper lg:p-6"
        aria-busy="true"
        aria-label="Loading events"
      >
        {#each Array(2) as _}
          <div class="flex animate-pulse flex-col overflow-hidden rounded-xl border border-paper-border bg-paper lg:rounded-2xl">
            <div class="h-40 bg-paper-border/60"></div>
            <div class="flex flex-col gap-3 p-4">
              <div class="h-4 w-2/3 rounded bg-paper-border/60"></div>
              <div class="h-3 w-1/3 rounded bg-paper-border/60"></div>
              <div class="h-2 w-full rounded-full bg-paper-border/60"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if events.length === 0}
      <RecentEventsEmpty />
    {:else}
      <div
        class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 lg:rounded-xl lg:border lg:border-paper-border lg:bg-paper lg:p-6"
      >
        {#each filteredEvents as event (event.id)}
          <OrganiserEventCard {event} {organiserName} on:share={() => shareEvent(event)} />
        {:else}
          <div class="col-span-full flex flex-col items-center gap-2 py-10 text-center">
            <SearchX class="size-8 text-ink-muted" aria-hidden="true" />
            <p class="m-0 text-[15px] font-bold text-ink">No events match</p>
            <p class="m-0 text-[13px] text-ink-secondary">Try a different name or status.</p>
            <button
              type="button"
              class="mt-1 cursor-pointer rounded-full border border-paper-border bg-paper px-4 py-2 text-[13px] font-semibold text-ink hover:border-brand/40"
              on:click={clearFilters}
            >
              Clear filters
            </button>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<!-- Mobile Create Event FAB (4:651) -->
<a
  href="/dashboard/events/createEvent"
  class="fixed bottom-6 right-5 z-20 flex items-center gap-2 rounded-full bg-brand px-5 py-3.5 text-[14px] font-bold text-white no-underline shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-opacity hover:opacity-90 lg:hidden"
>
  <Plus class="size-4" aria-hidden="true" />
  Create Event
</a>

<ShareEventModal
  event={selectedEventForSharing}
  isOpen={showShareModal}
  on:close={closeShareModal}
/>
