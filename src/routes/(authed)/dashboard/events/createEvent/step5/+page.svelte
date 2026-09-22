<script>
  // @ts-nocheck
  /** FR-8a Step 5: Status (HI-FI 55:1607 / mobile 36:223). */
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import Check from "lucide-svelte/icons/check";

  const STATUS_SNAPSHOT_KEY = "eventCreateStatus";

  /** @type {Record<string, unknown> | null} */
  let snapshot = null;
  let copied = false;
  let copyTimer;

  onMount(() => {
    try {
      const raw = sessionStorage.getItem(STATUS_SNAPSHOT_KEY);
      if (raw) snapshot = JSON.parse(raw);
    } catch {
      snapshot = null;
    }
  });

  $: eventId = snapshot?.event_id ? String(snapshot.event_id) : "";
  $: shareUrl = eventId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/marketplace/eventDetails/${eventId}`
    : "";
  $: statusKey = String(snapshot?.status || "draft");
  $: visibilityKey = String(snapshot?.event_visibility || "public");
  $: isDraft = statusKey === "draft";
  $: isPrivate = visibilityKey === "private";
  $: headline = `${isDraft ? "DRAFT" : "PUBLISHED"} · ${isPrivate ? "PRIVATE" : "PUBLIC"}`;
  $: subcopy = isDraft
    ? "Saved as draft."
    : isPrivate
      ? "Hidden from browse. Share the link."
      : "Visible in browse.";
  $: visibilityValue = isPrivate ? "Private · Link only" : "Public · Browse";
  $: ticketsReleased = Number(snapshot?.total_capacity) || 0;
  $: ticketTypeCount = Number(snapshot?.ticket_type_count) || 0;
  $: daysUntil = daysUntilEvent(snapshot?.date);

  function formatDateTime(dateStr, timeStr) {
    if (!dateStr) return "—";
    const iso = timeStr
      ? `${dateStr}T${timeStr.length === 5 ? `${timeStr}:00` : timeStr}`
      : `${dateStr}T00:00:00`;
    const base = new Date(iso);
    if (Number.isNaN(base.getTime())) {
      return timeStr ? `${dateStr} · ${timeStr}` : dateStr;
    }
    const datePart = base.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (!timeStr) return datePart;
    const timePart = base.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} · ${timePart}`;
  }

  function daysUntilEvent(dateStr) {
    if (!dateStr) return 0;
    const target = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(target.getTime())) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
    return Math.max(0, diff);
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copied = false;
      }, 1500);
    } catch {
      /* ignore */
    }
  }

  function goDashboard() {
          goto("/dashboard/events");
  }

  function inviteStaff() {
    goto("/dashboard/invite-staff");
  }

  function editEvent() {
    if (!eventId) {
      goDashboard();
      return;
    }
    goto(`/dashboard/events/editEvent/${eventId}/step1`);
  }
</script>

<div
  class="mx-auto flex w-full max-w-[600px] flex-col gap-2.5 lg:gap-4"
  in:fade={{ duration: 200 }}
>
  {#if !snapshot}
    <div
      class="rounded-2xl border border-paper-border bg-white p-8 text-center"
    >
      <h2 class="m-0 text-xl font-bold text-ink">No status to show</h2>
      <p class="mt-2 text-sm text-ink-secondary">
        Publish or save a draft from Review to see status here.
      </p>
        <button
        type="button"
        class="mt-6 w-full rounded-lg bg-brand px-6 py-3.5 text-sm font-extrabold text-white transition hover:opacity-90 cursor-pointer"
        on:click={goDashboard}
        >
        Go to Dashboard
        </button>
    </div>
  {:else}
    <div class="flex flex-col items-center gap-1.5 pt-1 text-center lg:gap-3 lg:pt-2">
      <div
        class="flex size-12 items-center justify-center rounded-full bg-accent-green-soft"
        aria-hidden="true"
      >
        <div
          class="flex size-8 items-center justify-center rounded-full bg-accent-green text-white"
        >
          <Check size={18} strokeWidth={3} />
        </div>
      </div>
      <div class="flex flex-col gap-0.5 lg:gap-1">
        <h2
          class="m-0 font-display text-[18px] font-bold uppercase tracking-tight text-ink lg:font-sans lg:text-2xl lg:font-extrabold"
        >
          {headline}
          </h2>
        <p class="m-0 text-[12px] text-ink-secondary lg:text-sm">{subcopy}</p>
            </div>
          </div>

    <section
      class="flex flex-col gap-1 overflow-hidden rounded-xl border border-paper-border bg-white px-4 py-2.5 lg:gap-4 lg:p-5"
    >
      <p
        class="m-0 text-[10px] font-semibold uppercase tracking-wide text-ink-muted lg:text-[11px]"
      >
        Event Summary
      </p>
      <dl class="m-0 flex flex-col gap-1 lg:gap-3.5">
        <div class="flex flex-col gap-px">
          <dt
            class="m-0 text-[9px] font-medium uppercase tracking-wide text-brand lg:text-[12px] lg:font-semibold"
          >
            Event Name
          </dt>
          <dd class="m-0 text-[15px] font-bold text-ink lg:text-base">
            {snapshot.name || "—"}
          </dd>
        </div>
        <div class="flex flex-col gap-px">
          <dt
            class="m-0 text-[9px] font-medium uppercase tracking-wide text-brand lg:text-[12px] lg:font-semibold"
          >
            Date &amp; Time
          </dt>
          <dd
            class="m-0 text-[13px] font-semibold text-ink lg:text-base lg:font-bold"
          >
            {formatDateTime(snapshot.date, snapshot.time)}
          </dd>
        </div>
        <div class="flex flex-col gap-px">
          <dt
            class="m-0 text-[9px] font-medium uppercase tracking-wide text-brand lg:text-[12px] lg:font-semibold"
          >
            Venue
          </dt>
          <dd
            class="m-0 text-[13px] font-semibold text-ink lg:text-base lg:font-bold"
          >
            {snapshot.location || "—"}
          </dd>
        </div>
        <div class="flex flex-col gap-px">
          <dt
            class="m-0 text-[9px] font-medium uppercase tracking-wide text-brand lg:text-[12px] lg:font-semibold"
          >
            Visibility
          </dt>
          <dd
            class="m-0 text-[13px] font-semibold text-ink lg:text-base lg:font-bold"
          >
            {visibilityValue}
          </dd>
        </div>
      </dl>
    </section>

    <!-- Mobile share row -->
    <div
      class="flex items-center gap-2 overflow-hidden rounded-[10px] border border-paper-border bg-white px-3.5 py-2.5 lg:hidden"
    >
      <p class="m-0 min-w-0 flex-1 truncate text-[11px] text-ink-muted">
        {shareUrl || "—"}
      </p>
          <button
        type="button"
        class="shrink-0 rounded-lg bg-brand px-3.5 py-1.5 text-[11px] font-semibold text-white transition hover:opacity-90 cursor-pointer"
        on:click={copyLink}
          >
        {copied ? "Copied" : "Copy"}
          </button>
        </div>

    <!-- Desktop share section -->
    <section
      class="hidden flex-col gap-3 rounded-xl border border-paper-border bg-white p-5 lg:flex"
    >
      <p
        class="m-0 text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
      >
        Share Event
      </p>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          type="text"
          readonly
          value={shareUrl}
          class="min-w-0 flex-1 rounded-lg border border-paper-border bg-paper-cream px-3 py-2.5 text-base text-ink outline-none"
          aria-label="Event share link"
        />
        <button
          type="button"
          class="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 cursor-pointer"
          on:click={copyLink}
        >
          {copied ? "Copied" : "Copy Link"}
        </button>
      </div>
    </section>

    <div class="grid grid-cols-2 gap-1.5 lg:grid-cols-4 lg:gap-3">
      <div
        class="rounded-[10px] border border-paper-border bg-white px-3 py-2 text-left lg:rounded-xl lg:py-3.5 lg:text-center"
      >
        <p
          class="m-0 text-[8px] font-medium uppercase tracking-wide text-ink-muted lg:text-[10px] lg:font-semibold"
        >
          <span class="lg:hidden">Tickets</span>
          <span class="hidden lg:inline">Tickets Released</span>
        </p>
        <p class="m-0 text-[18px] font-bold text-ink lg:mt-1 lg:text-lg lg:font-extrabold">
          {ticketsReleased}
          </p>
        </div>
      <div
        class="rounded-[10px] border border-paper-border bg-white px-3 py-2 text-left lg:rounded-xl lg:py-3.5 lg:text-center"
      >
        <p
          class="m-0 text-[8px] font-medium uppercase tracking-wide text-ink-muted lg:text-[10px] lg:font-semibold"
        >
          Revenue
        </p>
        <p class="m-0 text-[18px] font-bold text-ink lg:mt-1 lg:text-lg lg:font-extrabold">
          NLe 0.00
                  </p>
                </div>
      <div
        class="rounded-[10px] border border-paper-border bg-white px-3 py-2 text-left lg:rounded-xl lg:py-3.5 lg:text-center"
      >
        <p
          class="m-0 text-[8px] font-medium uppercase tracking-wide text-ink-muted lg:text-[10px] lg:font-semibold"
        >
          <span class="lg:hidden">Types</span>
          <span class="hidden lg:inline">Ticket Types</span>
        </p>
        <p class="m-0 text-[18px] font-bold text-ink lg:mt-1 lg:text-lg lg:font-extrabold">
          {ticketTypeCount}
                  </p>
                </div>
      <div
        class="rounded-[10px] border border-paper-border bg-white px-3 py-2 text-left lg:rounded-xl lg:py-3.5 lg:text-center"
      >
        <p
          class="m-0 text-[8px] font-medium uppercase tracking-wide text-ink-muted lg:text-[10px] lg:font-semibold"
        >
          <span class="lg:hidden">Days Left</span>
          <span class="hidden lg:inline">Days Until Event</span>
        </p>
        <p class="m-0 text-[18px] font-bold text-ink lg:mt-1 lg:text-lg lg:font-extrabold">
          {daysUntil}
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-1.5 pt-0.5 lg:gap-3 lg:pt-1">
      <!-- Mobile: Edit | Invite -->
      <div class="grid grid-cols-2 gap-2 lg:hidden">
        <button
          type="button"
          class="rounded-[10px] border border-paper-border bg-white py-2 text-[13px] font-semibold text-ink transition hover:bg-paper-cream cursor-pointer"
          on:click={editEvent}
        >
          Edit Event
        </button>
      <button
          type="button"
          class="rounded-[10px] border border-paper-border bg-white py-2 text-[13px] font-semibold text-ink transition hover:bg-paper-cream cursor-pointer"
          on:click={inviteStaff}
      >
          Invite Staff
      </button>
      </div>

      <!-- Desktop: Invite | Edit | Share -->
      <div class="hidden grid-cols-1 gap-2 sm:grid-cols-3 lg:grid">
        <button
          type="button"
          class="rounded-lg border border-paper-border bg-white px-3 py-3 text-sm font-bold text-ink transition hover:bg-paper-cream cursor-pointer"
          on:click={inviteStaff}
        >
          Invite Staff
        </button>
        <button
          type="button"
          class="rounded-lg border border-paper-border bg-white px-3 py-3 text-sm font-bold text-ink transition hover:bg-paper-cream cursor-pointer"
          on:click={editEvent}
        >
          Edit Event
        </button>
        <button
          type="button"
          class="rounded-lg border border-paper-border bg-white px-3 py-3 text-sm font-bold text-ink transition hover:bg-paper-cream cursor-pointer"
          on:click={copyLink}
        >
          Share Event
        </button>
      </div>

      <button
        type="button"
        class="w-full rounded-xl bg-brand px-6 py-2.5 text-[14px] font-bold text-white transition hover:opacity-90 cursor-pointer lg:rounded-lg lg:py-3.5 lg:text-base lg:font-extrabold"
        on:click={goDashboard}
      >
        Go to Dashboard
      </button>
    </div>
  {/if}
</div>
