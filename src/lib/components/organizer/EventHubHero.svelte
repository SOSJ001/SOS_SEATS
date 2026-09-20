<script>
  // @ts-nocheck
  /**
   * Event hero — desktop HI-FI 1125:2000 / mobile Overview Card 1136:2051
   * (instances on Overview / Guests / Generate).
   */
  import { goto } from "$app/navigation";
  import Copy from "lucide-svelte/icons/copy";
  import Pencil from "lucide-svelte/icons/pencil";
  import Calendar from "lucide-svelte/icons/calendar";
  import { showToast } from "$lib/store";

  /** @type {any} */
  export let event = null;

  let copied = false;

  $: shareUrl =
    typeof window !== "undefined" && event?.id
      ? `${window.location.origin}/marketplace/eventDetails/${event.id}`
      : event?.id
        ? `/marketplace/eventDetails/${event.id}`
        : "";

  $: dateVenueLine = (() => {
    const datePart = formatShortDate(event?.rawDate);
    const loc = event?.location || "Venue TBD";
    return datePart ? `${datePart} · ${loc}` : loc;
  })();

  $: statusKey = String(event?.status || "draft").toLowerCase();
  $: isLiveStatus = statusKey === "live" || statusKey === "published";
  $: statusLabel = isLiveStatus
    ? "Published"
    : statusKey
      ? statusKey.charAt(0).toUpperCase() + statusKey.slice(1)
      : "Draft";
  $: visibilityLabel =
    String(event?.event_visibility || "public").toLowerCase() === "private"
      ? "Private"
      : "Public";
  $: statusBadgeText = `${statusLabel} · ${visibilityLabel}`;

  function formatShortDate(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      const full = shareUrl.startsWith("http")
        ? shareUrl
        : `${window.location.origin}${shareUrl}`;
      await navigator.clipboard.writeText(full);
      copied = true;
      showToast("success", "Link copied", "Event link copied to clipboard.");
      setTimeout(() => (copied = false), 1500);
    } catch {
      showToast("error", "Copy failed", "Could not copy link.");
    }
  }

  function editEvent() {
    if (!event?.id) return;
    goto(`/dashboard/events/editEvent/${event.id}/step1`);
  }
</script>

{#if event}
  <!-- Mobile Overview Card — HI-FI 1136:2051 -->
  <div
    class="flex w-full flex-col gap-4 overflow-hidden rounded-2xl border border-paper-border bg-paper p-4 shadow-[0px_10px_24px_-10px_rgba(0,0,0,0.05)] lg:hidden"
  >
    <div
      class="relative h-[180px] w-full shrink-0 overflow-hidden rounded-2xl bg-paper-cream"
    >
      {#if event.image}
        <img
          src={event.image}
          alt=""
          class="pointer-events-none absolute inset-0 size-full max-w-none scale-110 object-cover blur-xl"
          aria-hidden="true"
        />
        <img
          src={event.image}
          alt="Event cover"
          class="absolute inset-0 size-full max-w-none object-contain"
        />
      {:else}
        <div
          class="flex h-full w-full items-center justify-center text-sm text-ink-muted"
        >
          No cover image
        </div>
      {/if}
    </div>

    <div class="flex flex-col gap-2">
      <h2 class="m-0 text-[22px] font-extrabold leading-tight text-ink">
        {event.title || "Untitled event"}
      </h2>
      <span
        class="inline-flex w-fit rounded-full px-2 py-1 text-[10px] font-bold
          {isLiveStatus
          ? 'bg-[#ecfdf5] text-[#10b981]'
          : 'bg-paper-cream text-ink-secondary'}"
      >
        {statusBadgeText}
      </span>
      <p class="m-0 text-[13px] font-medium text-ink-secondary">
        {dateVenueLine}
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-[12px] font-bold text-ink cursor-pointer hover:bg-paper-cream"
        on:click={copyLink}
      >
        {copied ? "Copied" : "Copy event link"}
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border-0 bg-brand px-3.5 py-2.5 text-[12px] font-bold text-white cursor-pointer hover:opacity-90"
        on:click={editEvent}
      >
        Edit event
      </button>
    </div>
  </div>

  <!-- Desktop Event Hero Card — HI-FI 1125:2000 -->
  <div
    class="hidden w-full items-center gap-6 overflow-hidden rounded-2xl border border-paper-border bg-paper p-6 shadow-[0px_10px_24px_-8px_rgba(0,0,0,0.05)] lg:flex"
  >
    <div
      class="relative h-[220px] w-[420px] shrink-0 overflow-hidden rounded-2xl bg-paper-cream"
    >
      {#if event.image}
        <img
          src={event.image}
          alt=""
          class="pointer-events-none absolute inset-0 size-full max-w-none scale-110 object-cover blur-xl"
          aria-hidden="true"
        />
        <img
          src={event.image}
          alt="Event cover"
          class="absolute inset-0 size-full max-w-none object-contain"
        />
      {:else}
        <div
          class="flex h-full w-full items-center justify-center text-sm text-ink-muted"
        >
          No cover image
        </div>
      {/if}
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <div class="flex flex-col gap-2.5">
        <h2 class="m-0 text-[34px] font-extrabold leading-[1.2] text-ink">
          {event.title || "Untitled event"}
        </h2>
        <div
          class="flex w-full items-center gap-2.5 rounded-xl border border-[#ffe9d2] bg-[#fff4ed] px-3 py-2.5"
        >
          <Calendar
            size={18}
            class="shrink-0 text-brand"
            aria-hidden="true"
          />
          <p class="m-0 text-sm font-semibold text-ink-secondary">
            {dateVenueLine}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2.5 rounded-xl border border-[#e8e3dd] bg-white px-4 py-3 text-sm font-bold text-ink shadow-[0px_6px_8px_rgba(0,0,0,0.04)] cursor-pointer hover:bg-paper-cream"
          on:click={copyLink}
        >
          <Copy size={18} class="text-brand" aria-hidden="true" />
          {copied ? "Copied" : "Copy event link"}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2.5 rounded-xl border-0 bg-brand px-4 py-3 text-sm font-extrabold text-white shadow-[0px_10px_11px_rgba(237,107,45,0.2)] cursor-pointer hover:opacity-90"
          on:click={editEvent}
        >
          <Pencil size={18} aria-hidden="true" />
          Edit event
        </button>
      </div>
    </div>
  </div>
{/if}
