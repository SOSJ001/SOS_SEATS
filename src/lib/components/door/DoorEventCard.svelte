<script>
  // @ts-nocheck
  /**
   * Door events card (roadmap 7.2): desktop 530:338 / mobile 448:101.
   * variant="staff": staff landing (424:82 / 530:195) with an image pill on mobile.
   */
  import Calendar from "lucide-svelte/icons/calendar";
  import MapPin from "lucide-svelte/icons/map-pin";
  import QrCode from "lucide-svelte/icons/qr-code";
  import ScanLine from "lucide-svelte/icons/scan-line";
  import EventCover from "$lib/components/event/EventCover.svelte";
  import { formatEventDateTime, percent } from "./doorFormat.js";

  /** @type {{ id: string; name: string; date: string|null; time: string|null; location: string|null; imageUrl: string|null; organizer?: string|null; phase: "active"|"upcoming"|"past"; checkedIn: number; total: number }} */
  export let event;
  /** "organiser" | "staff" */
  export let variant = "organiser";

  const CHIPS = {
    active: {
      label: "Active",
      cls: "bg-[rgba(34,197,94,0.12)] border-[rgba(34,197,94,0.5)] text-[#16a34a]",
      dot: "bg-[#16a34a]",
      pill: "border-brand text-brand",
    },
    upcoming: {
      label: "Upcoming",
      cls: "bg-accent-blue-soft border-[rgba(59,130,246,0.4)] text-accent-blue",
      dot: "bg-accent-blue",
      pill: "border-accent-blue text-accent-blue",
    },
    past: {
      label: "Ended",
      cls: "bg-[#f8fafc] border-[#e2e8f0] text-ink-secondary",
      dot: "bg-[#94a3b8]",
      pill: "border-slate-400 text-slate-500",
    },
  };

  $: staff = variant === "staff";
  $: chip = CHIPS[event.phase] || CHIPS.upcoming;
  $: when = formatEventDateTime(event.date, event.time);
  $: fill = percent(event.checkedIn, event.total);
</script>

<article
  class="flex min-w-0 flex-col overflow-hidden border border-paper-border bg-paper {staff
    ? 'rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.05)] md:rounded-xl md:shadow-[0_10px_24px_-8px_rgba(0,0,0,0.05)]'
    : 'rounded-xl shadow-[0_10px_24px_-8px_rgba(0,0,0,0.05)]'}"
>
  <div class="relative w-full shrink-0 {staff ? 'h-[140px] md:h-40' : 'h-[140px]'}">
    <EventCover src={event.imageUrl} fill />
    <div
      class="absolute inset-0 bg-gradient-to-b from-transparent pointer-events-none {staff
        ? 'to-black/70 md:to-black/40'
        : 'to-black/40'}"
      aria-hidden="true"
    ></div>
    {#if staff}
      <span
        class="absolute right-3 top-3 md:hidden rounded border bg-white/90 px-2 py-[3px] text-[10px] font-bold shadow-[0_0_8px_rgba(255,90,31,0.2)] {chip.pill}"
      >
        {chip.label}
      </span>
    {/if}
  </div>

  <div class="flex flex-col {staff ? 'gap-3 p-4' : 'gap-4 p-4 md:gap-3'}">
    <div class="flex flex-col gap-1">
      <div class="flex items-center justify-between gap-2">
        <h3 class="m-0 min-w-0 truncate text-lg font-extrabold text-ink">{event.name}</h3>
        <span
          class="shrink-0 items-center gap-1.5 rounded border px-2 py-[3px] text-[10px] font-bold {chip.cls} {staff
            ? 'hidden md:inline-flex'
            : 'inline-flex'}"
        >
          <span class="size-1.5 rounded-full {chip.dot}" aria-hidden="true"></span>
          {chip.label}
        </span>
      </div>
      {#if staff && event.organizer}
        <p class="m-0 truncate text-[11px] text-ink-secondary">Created by {event.organizer}</p>
      {/if}
    </div>

    <div class="flex flex-col gap-2.5">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-secondary">
        <span class="inline-flex items-center gap-1.5">
          <Calendar
            class="size-3.5 shrink-0 {staff ? 'text-brand md:text-ink-secondary' : ''}"
            aria-hidden="true"
          />
          {when}
        </span>
        {#if event.location}
          <span class="inline-flex min-w-0 items-center gap-1.5">
            <MapPin
              class="size-3.5 shrink-0 {staff ? 'text-brand md:text-ink-secondary' : ''}"
              aria-hidden="true"
            />
            <span class="truncate">{event.location}</span>
          </span>
        {/if}
      </div>

      <div class="hidden md:flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="text-ink-secondary">Tickets scanned</span>
          <span class="font-bold text-brand">{event.checkedIn} / {event.total}</span>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-[3px] bg-paper-border">
          <div class="h-full rounded-[3px] bg-brand" style="width: {fill}%"></div>
        </div>
      </div>
    </div>

    <a
      href="/dashboard/scanner/{event.id}"
      class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-bold text-white hover:opacity-95 md:py-2 md:text-[13px] {staff
        ? 'shadow-[0_4px_6px_rgba(255,90,31,0.25)] md:shadow-none'
        : ''}"
    >
      {#if staff}
        <QrCode class="size-4" aria-hidden="true" />
      {:else}
        <ScanLine class="size-4" aria-hidden="true" />
      {/if}
      Start Scanning
    </a>
  </div>
</article>
