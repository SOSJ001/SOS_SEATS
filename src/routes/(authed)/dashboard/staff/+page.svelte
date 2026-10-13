<script>
  // @ts-nocheck
  /** Staff assigned events (FR-43, roadmap 7.3): mobile 424:82 / desktop 530:195. */
  import Search from "lucide-svelte/icons/search";
  import Users from "lucide-svelte/icons/users";
  import BadgeCheck from "lucide-svelte/icons/badge-check";
  import Ticket from "lucide-svelte/icons/ticket";
  import DoorEventCard from "$lib/components/door/DoorEventCard.svelte";
  import DoorStatCard from "$lib/components/door/DoorStatCard.svelte";
  import DoorStaffFooter from "$lib/components/door/DoorStaffFooter.svelte";
  import DoorEmptyState from "$lib/components/door/DoorEmptyState.svelte";
  import { staffContactLabel } from "$lib/components/staff/staffFormat.js";

  export let data;

  let query = "";

  $: events = data.doorEvents || [];
  $: summary = data.summary || { activeEvents: 0, scannedToday: 0, notCheckedIn: 0 };
  $: contactLabel = data.staffContact ? staffContactLabel(data.staffContact) : "";
  $: countLabel = `${events.length} event${events.length === 1 ? "" : "s"} assigned to you`;
  $: needle = query.trim().toLowerCase();
  $: filtered = needle
    ? events.filter(
        (e) =>
          String(e.name || "").toLowerCase().includes(needle) ||
          String(e.location || "").toLowerCase().includes(needle)
      )
    : events;
</script>

<svelte:head>
  <title>My Events | SOS SEATS</title>
</svelte:head>

<div class="flex flex-1 flex-col md:gap-4 md:p-6">
  <section
    class="md:hidden flex flex-col gap-1.5 bg-gradient-to-r from-[#fff7f2] to-[#fff0e8] px-5 pb-5 pt-3"
  >
    <h1 class="m-0 text-xl font-extrabold text-ink">Your Assigned Events</h1>
    <p class="m-0 text-[13px] text-ink-secondary">{countLabel}</p>
  </section>

  {#if events.length > 0 && !data.loadError}
    <div class="md:hidden px-5 pt-2">
      <label
        class="flex items-center gap-2.5 rounded-xl border border-paper-border bg-paper px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:border-brand"
      >
        <Search size={18} class="shrink-0 text-ink-secondary" aria-hidden="true" />
        <span class="sr-only">Search events</span>
        <input
          type="search"
          bind:value={query}
          placeholder="Search events"
          class="w-full border-0 bg-transparent p-0 text-sm text-ink placeholder:text-ink-secondary focus:outline-none focus:ring-0"
        />
      </label>
    </div>
  {/if}

  <section
    class="hidden md:flex flex-col gap-2 rounded-[20px] bg-gradient-to-r from-slate-public to-brand px-6 py-4"
  >
    <span class="self-start rounded bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white">
      STAFF PORTAL
    </span>
    <h1 class="m-0 text-2xl font-extrabold text-white">Staff Assigned Events</h1>
    <p class="m-0 text-sm text-white/80">Your assigned events for scanning and check-in</p>
  </section>

  <div class="hidden md:flex gap-4">
    <DoorStatCard
      layout="summary"
      tone="orange"
      icon={Users}
      value={events.length}
      label="Assigned Events"
      caption={events.length ? "Ready for scanning" : "Nothing to scan yet"}
    />
    <DoorStatCard
      layout="summary"
      tone="green"
      icon={BadgeCheck}
      value={summary.scannedToday}
      label="Total Scans Today"
      caption="Across all venues"
    />
    <DoorStatCard
      layout="summary"
      tone="blue"
      icon={Ticket}
      value={summary.activeEvents}
      label="Active Today"
      caption={summary.activeEvents ? "Scanning open" : "No events today"}
    />
  </div>

  {#if data.loadError}
    <div class="px-5 pb-5 pt-2 md:p-0">
      <div class="rounded-2xl border border-dashed border-paper-border px-5 py-8 text-center">
        <p class="m-0 text-base font-bold text-ink">Couldn't load your events</p>
        <p class="m-0 mt-1 text-sm text-ink-secondary">Please refresh the page to try again.</p>
      </div>
    </div>
  {:else if events.length === 0}
    <div class="flex flex-1 flex-col justify-center px-5 pb-5 pt-2 md:flex-none md:p-0">
      <DoorEmptyState
        title="No events assigned yet"
        body="Ask your organizer to assign you an event."
      />
    </div>
  {:else if filtered.length === 0}
    <div class="px-5 pb-5 pt-2 md:p-0">
      <div class="rounded-2xl border border-dashed border-paper-border px-5 py-8 text-center">
        <p class="m-0 text-base font-bold text-ink">No events match</p>
        <p class="m-0 mt-1 text-sm text-ink-secondary">Try a different search.</p>
      </div>
    </div>
  {:else}
    <div class="grid gap-4 px-5 pb-5 pt-2 md:grid-cols-2 md:p-0 lg:grid-cols-3">
      {#each filtered as event (event.id)}
        <DoorEventCard {event} variant="staff" />
      {/each}
    </div>
  {/if}

  <DoorStaffFooter contact={contactLabel} />
</div>
