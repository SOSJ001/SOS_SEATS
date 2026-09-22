<script>
  // @ts-nocheck
  /**
   * Mobile free claim success — HI-FI free-claim-success 1176:2090.
   */
  import Check from "lucide-svelte/icons/check";
  import { showToast } from "$lib/store";

  export let eventName = "";
  export let dateLabel = "";
  export let dateTimeLabel = "";
  export let eventLocation = "";
  export let orderNumber = "";
  export let ticketCount = 1;
  export let shareUrl = "/marketplace";
  export let primaryHref = "/dashboard/my-tickets";
  export let browseHref = "/marketplace";

  $: orderIdDisplay = orderNumber?.startsWith("#")
    ? orderNumber
    : `#${orderNumber || "—"}`;
  $: ticketMeta = [dateLabel, eventLocation].filter(Boolean).join(" · ");
  $: readyTitle =
    ticketCount === 1 ? "Your ticket is ready!" : "Your tickets are ready!";
  $: subcopy =
    ticketCount === 1
      ? "Your free ticket has been claimed. Check in with your QR code at the door."
      : "Your free tickets have been claimed. Check in with your QR code at the door.";

  async function shareWithFriends() {
    const url =
      typeof window !== "undefined" && shareUrl.startsWith("/")
        ? `${window.location.origin}${shareUrl}`
        : shareUrl;
    const title = eventName || "SOS SEATS";
    const text = `I just claimed free tickets for ${eventName} on SOS SEATS!`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast("success", "Link copied", "Event link copied to clipboard.");
        return;
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
    }
    showToast("error", "Share failed", "Could not share this event.");
  }
</script>

<div class="flex min-h-full flex-col bg-[#faf8f5]">
  <div class="flex w-full flex-col items-center gap-5 p-6">
    <div
      class="flex size-16 items-center justify-center rounded-full border-2 border-[#17a34a] bg-[#faf9f7]"
      aria-hidden="true"
    >
      <Check size={28} class="text-[#17a34a]" strokeWidth={3} />
    </div>

    <div
      class="flex w-full flex-col gap-4 rounded-[14px] border-[1.5px] border-paper-border bg-white p-5 shadow-[0_6px_8px_rgba(0,0,0,0.06)]"
    >
      <div class="flex w-full flex-col gap-1">
        <h1 class="m-0 text-[22px] font-extrabold text-ink">Ticket Claimed!</h1>
        <p class="m-0 text-[13px] text-ink-secondary">{subcopy}</p>
      </div>

      <div
        class="flex w-full flex-col gap-3 rounded-xl border border-brand bg-[#fff5f0] px-4 py-3.5 text-[13px]"
      >
        <div class="flex items-start justify-between gap-3">
          <span class="text-ink-secondary">Event</span>
          <span class="max-w-[180px] truncate text-right font-bold text-ink">
            {eventName}
          </span>
        </div>
        <div class="flex items-start justify-between gap-3">
          <span class="text-ink-secondary">Date &amp; Time</span>
          <span class="text-right font-bold text-ink">{dateTimeLabel}</span>
        </div>
        <div class="flex items-start justify-between gap-3">
          <span class="text-ink-secondary">Venue</span>
          <span class="max-w-[180px] truncate text-right font-bold text-ink">
            {eventLocation}
          </span>
        </div>
        <div class="flex items-start justify-between gap-3">
          <span class="text-ink-secondary">Ticket Type</span>
          <span class="font-bold text-ink">FREE TICKET</span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="font-medium text-ink-secondary">Order ID</span>
          <span class="font-bold text-ink">{orderIdDisplay}</span>
        </div>
      </div>
    </div>

    <div
      class="flex w-full flex-col gap-1 rounded-xl border border-paper-border bg-[#faf9f7] px-4 py-3 text-center"
    >
      <p class="m-0 text-sm font-extrabold text-ink">{readyTitle}</p>
      <p class="m-0 text-[13px] text-ink-secondary">
        Tap below to view your entry QR.
      </p>
    </div>

    <a
      href={primaryHref}
      class="flex w-full items-center justify-between gap-3 rounded-xl border border-paper-border bg-white p-3.5 no-underline"
    >
      <div class="flex min-w-0 flex-1 flex-col gap-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="rounded bg-[#f5f5f5] px-2 py-1 text-[11px] font-extrabold text-[#22c55e]"
          >
            Valid
          </span>
          <span class="text-[11px] font-bold text-ink-secondary"
            >FREE TICKET · NLe 0</span
          >
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <p class="m-0 truncate text-base font-extrabold text-ink">
            {eventName}
          </p>
          {#if ticketMeta}
            <p class="m-0 truncate text-[13px] text-ink-secondary">
              {ticketMeta}
            </p>
          {/if}
        </div>
      </div>
      <div
        class="flex size-16 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-paper-border bg-white"
      >
        <span class="size-10 rounded bg-paper-border" aria-hidden="true"></span>
        <span class="text-[8px] font-bold text-ink">Tap QR</span>
      </div>
    </a>

    <a
      href={primaryHref}
      class="flex w-full items-center justify-center rounded-xl border-0 bg-brand px-6 py-4 text-sm font-extrabold text-white no-underline shadow-[0_4px_8px_rgba(255,90,31,0.25)] hover:opacity-90"
    >
      Show in My Tickets
    </a>

    <button
      type="button"
      class="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-paper-border bg-white text-sm font-extrabold text-ink hover:border-brand hover:text-brand"
      on:click={shareWithFriends}
    >
      Share with Friends
    </button>

    <a
      href={browseHref}
      class="flex w-full items-center justify-center py-3.5 text-[13px] font-extrabold text-brand no-underline hover:opacity-90"
    >
      Back to Browse
    </a>
  </div>
</div>
