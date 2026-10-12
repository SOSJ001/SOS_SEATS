<script>
  // @ts-nocheck
  /** Door events (roadmap 7.2): desktop 530:289 / mobile 448:82. Organiser picks an owned event to scan. */
  import Search from "lucide-svelte/icons/search";
  import Users from "lucide-svelte/icons/users";
  import BadgeCheck from "lucide-svelte/icons/badge-check";
  import Ticket from "lucide-svelte/icons/ticket";
  import DoorEventCard from "$lib/components/door/DoorEventCard.svelte";
  import DoorStatCard from "$lib/components/door/DoorStatCard.svelte";

  export let data;

  const TABS = [
    { id: "all", label: "All Events" },
    { id: "active", label: "Active" },
    { id: "upcoming", label: "Upcoming" },
  ];

  let query = "";
  let tab = "all";

  $: events = data.doorEvents || [];
  $: summary = data.summary || { activeEvents: 0, scannedToday: 0, notCheckedIn: 0 };
  $: needle = query.trim().toLowerCase();
  $: filtered = events.filter((e) => {
    if (tab !== "all" && e.phase !== tab) return false;
    if (!needle) return true;
    return (
      String(e.name || "").toLowerCase().includes(needle) ||
      String(e.location || "").toLowerCase().includes(needle)
    );
  });
</script>

<svelte:head>
  <title>Door Scanner | SOS SEATS</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-[1100px] flex-col gap-3">
  <section
    class="hidden md:flex flex-col gap-2 rounded-[20px] bg-gradient-to-r from-slate-public to-brand px-6 py-4"
  >
    <span class="self-start rounded bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white">
      ORGANISER PORTAL
    </span>
    <h1 class="m-0 text-2xl font-extrabold text-white">Door Scanner</h1>
    <p class="m-0 text-sm text-white/80">
      Select an event to begin scanning tickets and manage live check-ins.
    </p>
  </section>

  <label
    class="flex items-center gap-2.5 rounded-xl border border-paper-border bg-paper px-4 py-3.5 focus-within:border-brand md:py-2"
  >
    <Search class="size-4 shrink-0 text-ink-secondary" aria-hidden="true" />
    <span class="sr-only">Search events</span>
    <input
      type="search"
      bind:value={query}
      placeholder="Search events"
      class="w-full border-0 bg-transparent p-0 text-sm text-ink placeholder:text-ink-secondary focus:outline-none focus:ring-0"
    />
  </label>

  <div class="hidden md:flex gap-4">
    <DoorStatCard
      layout="summary"
      tone="green"
      icon={Users}
      value={summary.activeEvents}
      label="Active Events"
      caption="Ready for scanning"
    />
    <DoorStatCard
      layout="summary"
      tone="orange"
      icon={BadgeCheck}
      value={summary.scannedToday}
      label="Scanned Today"
      caption="Across your events"
    />
    <DoorStatCard
      layout="summary"
      tone="blue"
      icon={Ticket}
      value={summary.notCheckedIn}
      label="Not checked in yet"
      caption="Today's events"
    />
  </div>

  <div class="hidden md:flex gap-3 py-0.5" role="tablist" aria-label="Filter events">
    {#each TABS as t}
      <button
        type="button"
        role="tab"
        aria-selected={tab === t.id}
        class="rounded-[20px] border px-4 py-2 text-[13px] font-bold {tab === t.id
          ? 'border-brand bg-brand text-white'
          : 'border-paper-border bg-paper text-ink hover:border-brand'}"
        on:click={() => (tab = t.id)}
      >
        {t.label}
      </button>
    {/each}
  </div>

  {#if data.loadError}
    <div class="rounded-2xl border border-dashed border-paper-border px-5 py-8 text-center">
      <p class="m-0 text-base font-bold text-ink">Couldn't load your events</p>
      <p class="m-0 mt-1 text-sm text-ink-secondary">Please refresh the page to try again.</p>
    </div>
  {:else if events.length === 0}
    <div class="rounded-2xl border border-dashed border-paper-border px-5 py-8 text-center">
      <p class="m-0 text-base font-bold text-ink">No published events yet</p>
      <p class="m-0 mt-1 text-sm text-ink-secondary">
        Publish an event to start scanning tickets at the door.
      </p>
      <a
        href="/dashboard/events/createEvent"
        class="mt-3 inline-block text-sm font-semibold text-brand underline hover:opacity-90"
      >
        Create an event
      </a>
    </div>
  {:else if filtered.length === 0}
    <div class="rounded-2xl border border-dashed border-paper-border px-5 py-8 text-center">
      <p class="m-0 text-base font-bold text-ink">No events match</p>
      <p class="m-0 mt-1 text-sm text-ink-secondary">
        {tab === "active"
          ? "None of your events are happening today."
          : "Try a different search or filter."}
      </p>
    </div>
  {:else}
    <div class="grid gap-4 pt-1 md:grid-cols-2 xl:grid-cols-3">
      {#each filtered as event (event.id)}
        <DoorEventCard {event} />
      {/each}
    </div>
  {/if}
</div>
