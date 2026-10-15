<script>
  // @ts-nocheck
  /**
   * Organiser event card (HI-FI 55:965 desktop, 4:651 mobile).
   * Mobile: white card, revenue row on top. Desktop (lg): cream card, revenue at the bottom.
   */
  import { createEventDispatcher } from "svelte";
  import Calendar from "lucide-svelte/icons/calendar";
  import MapPin from "lucide-svelte/icons/map-pin";
  import Pencil from "lucide-svelte/icons/pencil";
  import Eye from "lucide-svelte/icons/eye";
  import EventCover from "$lib/components/event/EventCover.svelte";
  import EventCardMenu from "./EventCardMenu.svelte";
  import { canShareEvent } from "./mapOrganiserEvent.js";

  /**
   * @type {{ id: string | number, title: string, date: string, location?: string | null,
   *   image?: string | null, status: string, ticketsSold: number, capacity: number,
   *   revenueValue: number }}
   */
  export let event;
  export let organiserName = "";

  const dispatch = createEventDispatcher();

  const STATUS = {
    published: { label: "Active", cls: "border-[#00e676] text-[#00e676]" },
    live: { label: "Active", cls: "border-[#00e676] text-[#00e676]" },
    draft: { label: "Draft", cls: "border-[#f59e0b] text-[#f59e0b]" },
    cancelled: { label: "Cancelled", cls: "border-[#ff1744] text-[#ff1744]" },
    completed: { label: "Ended", cls: "border-paper-border text-ink-muted" },
  };

  $: status = STATUS[event.status?.toLowerCase()] || STATUS.draft;
  $: canShare = canShareEvent(event);
  $: canPublish = event.status?.toLowerCase() === "draft";
  $: hasCapacity = event.capacity > 0;
  $: pct = hasCapacity ? Math.min(100, (event.ticketsSold / event.capacity) * 100) : 0;
  $: revenueLabel = `NLe ${(event.revenueValue || 0).toLocaleString()}`;
</script>

<article
  class="flex flex-col rounded-xl border border-paper-border bg-paper shadow-[0_2px_5px_rgba(0,0,0,0.05)] lg:rounded-2xl lg:bg-[#fff7f2] lg:shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
>
  <div class="relative h-40 shrink-0 overflow-hidden rounded-t-xl lg:rounded-t-2xl">
    <EventCover src={event.image} alt={event.title} fill tone="light" />
    <span
      class="absolute right-3 top-3 rounded border bg-white/95 px-2 py-[3px] text-[10px] font-bold leading-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] lg:rounded-full {status.cls}"
    >
      {status.label}
    </span>
  </div>

  <div class="flex flex-1 flex-col gap-3 p-4">
    <div class="flex items-center justify-between gap-3 text-[13px] font-bold lg:hidden">
      <span class="text-brand">Revenue</span>
      <span class="text-ink">{revenueLabel}</span>
    </div>

    <div class="flex flex-col gap-1">
      <h3
        class="m-0 text-[18px] font-extrabold leading-snug text-ink lg:text-[14px] lg:font-bold"
      >
        {event.title}
      </h3>
      {#if organiserName}
        <p class="m-0 text-[11px] text-ink-secondary">Created by {organiserName}</p>
      {/if}
    </div>

    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-secondary">
      <span class="flex items-center gap-1.5">
        <Calendar class="size-3.5 shrink-0" aria-hidden="true" />
        {event.date}
      </span>
      {#if event.location}
        <span class="flex min-w-0 items-center gap-1.5">
          <MapPin class="size-3.5 shrink-0" aria-hidden="true" />
          <span class="truncate">{event.location}</span>
        </span>
      {/if}
    </div>

    {#if hasCapacity}
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-[12px]">
          <span class="text-ink-secondary">Tickets sold</span>
          <span class="font-bold text-brand">
            {event.ticketsSold.toLocaleString()} / {event.capacity.toLocaleString()}
          </span>
        </div>
        <div
          class="h-1.5 w-full overflow-hidden rounded-[3px] bg-paper-border lg:h-2 lg:rounded-full"
          role="progressbar"
          aria-label="Tickets sold"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={Math.round(pct)}
        >
          <div class="h-full rounded-[3px] bg-brand lg:rounded-full" style="width: {pct}%"></div>
        </div>
        <div class="flex items-center justify-between text-[12px]">
          <span class="text-ink-secondary">{pct.toFixed(1)}%</span>
          <span class="font-bold text-brand">{Math.round(pct)}%</span>
        </div>
      </div>
    {:else}
      <p class="m-0 text-[12px] text-ink-secondary">
        <span class="font-bold text-brand">{event.ticketsSold.toLocaleString()}</span> sold
      </p>
    {/if}

    <p class="m-0 hidden text-[18px] font-extrabold text-ink lg:block">{revenueLabel}</p>

    <div class="mt-auto flex items-center gap-2">
      <a
        href="/dashboard/events/editEvent/{event.id}/step1"
        class="flex items-center gap-1.5 rounded-lg border border-paper-border bg-paper px-2.5 py-1.5 text-[12px] font-bold text-brand no-underline transition-colors hover:border-brand/40 lg:bg-[#fff7f2]"
      >
        <Pencil class="size-4" aria-hidden="true" />
        Edit
      </a>
      <a
        href="/dashboard/events/eventDetails?id={event.id}"
        class="flex items-center gap-1.5 rounded-lg border border-paper-border bg-paper px-2.5 py-1.5 text-[12px] font-bold text-ink-secondary no-underline transition-colors hover:text-ink lg:bg-[#fff7f2]"
      >
        <Eye class="size-4" aria-hidden="true" />
        View
      </a>
      {#if canShare || canPublish}
        <EventCardMenu
          eventId={event.id}
          eventTitle={event.title}
          {canPublish}
          {canShare}
          triggerClass="bg-paper lg:bg-[#fff7f2]"
          on:share={() => dispatch("share")}
        />
      {/if}
    </div>
  </div>
</article>
