<script>
  // @ts-nocheck
  /**
   * Buyer MM checkout success — Figma desktop-checkout-success SuccessCard 787:1488.
   */
  import Check from "lucide-svelte/icons/check";
  import Lock from "lucide-svelte/icons/lock";
  import TicketLivePreview from "$lib/components/organizer/TicketLivePreview.svelte";
  import {
    defaultTicketLayout,
    ensureTicketDesignWithLayout,
  } from "$lib/client/ticketLayout";
  import { defaultTicketDesignConfig, showToast } from "$lib/store";

  export let eventName = "";
  export let eventDate = "";
  export let eventTime = "";
  export let eventLocation = "";
  /** @type {Array<{ name?: string }>} */
  export let ticketTypes = [];
  export let ticketCount = 1;
  export let amountLabel = "";
  export let paymentMethod = "Orange Money";
  export let timestamp = "";
  export let orderNumber = "";
  /** @type {Record<string, any> | null} */
  export let ticketDesignConfig = null;
  export let qrData = "";
  export let shareUrl = "/marketplace";
  export let primaryHref = "/dashboard/my-tickets";
  export let browseHref = "/marketplace";

  $: ticketWord = ticketCount === 1 ? "ticket" : "tickets";
  $: statusLine = `${ticketCount} ${ticketWord} secured for ${eventName}`;
  $: orderIdDisplay = orderNumber?.startsWith("#")
    ? orderNumber
    : `#${orderNumber || "—"}`;
  $: previewLayout = (() => {
    const design = ensureTicketDesignWithLayout(
      ticketDesignConfig || defaultTicketDesignConfig
    );
    return {
      ...defaultTicketLayout,
      ...design.layout,
      includeVenue: design.layout?.includeVenue ?? true,
      includeDateTime: design.layout?.includeDateTime ?? true,
      showDisclaimer: design.layout?.showDisclaimer ?? true,
    };
  })();

  async function shareWithFriends() {
    const url =
      typeof window !== "undefined" && shareUrl.startsWith("/")
        ? `${window.location.origin}${shareUrl}`
        : shareUrl;
    const title = eventName || "SOS SEATS";
    const text = `I just got tickets for ${eventName} on SOS SEATS!`;
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

<div
  class="relative z-10 flex w-full max-w-[480px] flex-col items-center gap-5 rounded-[20px] border border-paper-border bg-white p-5 shadow-[0_0_40px_rgba(255,90,31,0.05),0_8px_24px_rgba(18,4,28,0.04)] lg:gap-4 lg:p-4"
>
  <div class="flex w-full flex-col items-center gap-3 text-center lg:gap-2.5">
    <div
      class="flex size-[72px] items-center justify-center rounded-[36px] border-[2.5px] border-[#22c55e] bg-[#ecfdf5] shadow-[0_0_12px_rgba(34,197,94,0.2)] lg:size-16 lg:rounded-full"
      aria-hidden="true"
    >
      <div
        class="flex size-14 items-center justify-center rounded-[28px] border-2 border-[#22c55e] bg-white lg:size-12 lg:rounded-full"
      >
        <Check size={24} class="text-[#22c55e]" strokeWidth={3} />
      </div>
    </div>
    <div class="flex w-full flex-col gap-1.5 lg:gap-1">
      <h2 class="m-0 text-[26px] font-extrabold text-ink lg:text-xl">
        Payment Confirmed!
      </h2>
      <p
        class="m-0 text-[13px] leading-[18px] text-ink-secondary lg:text-[12px]"
      >
        Your tickets have been reserved and secured. Check in with your QR code
        at the door.
      </p>
    </div>
    <div class="flex flex-wrap items-center justify-center gap-1.5">
      <span
        class="rounded px-2 py-1 text-[11px] font-bold text-[#15803d] bg-[#dcfce7]"
      >
        Valid
      </span>
      <p class="m-0 text-xs font-semibold text-ink-secondary">{statusLine}</p>
    </div>
  </div>

  <div class="flex w-full justify-center">
    <TicketLivePreview
      layout={previewLayout}
      {eventName}
      {eventDate}
      {eventTime}
      {eventLocation}
      {ticketTypes}
      ticketNumber={orderIdDisplay}
      {qrData}
    />
  </div>

  <div
    class="flex w-full flex-col gap-2 rounded-[14px] border-2 border-brand bg-[#fff7ed] px-3.5 py-3 lg:gap-1.5 lg:px-3 lg:py-2.5"
  >
    <div class="flex items-center justify-between gap-3 text-[13px] lg:text-[12px]">
      <span class="text-ink-secondary">Event</span>
      <span class="truncate text-right font-bold text-ink">{eventName}</span>
    </div>
    <div class="flex items-center justify-between gap-3 text-[13px] lg:text-[12px]">
      <span class="text-ink-secondary">Amount Paid</span>
      <span class="font-bold text-ink">{amountLabel}</span>
    </div>
    <div class="flex items-center justify-between gap-3 text-[13px] lg:text-[12px]">
      <span class="text-ink-secondary">Payment Method</span>
      <span class="font-bold text-ink">{paymentMethod}</span>
    </div>
    <div class="flex items-center justify-between gap-3 text-[13px] lg:text-[12px]">
      <span class="text-ink-secondary">Timestamp</span>
      <span class="font-bold text-ink">{timestamp}</span>
    </div>
    <div class="flex items-center justify-between gap-3 text-[13px] lg:text-[12px]">
      <span class="text-ink-secondary">Order ID</span>
      <span class="font-bold text-ink">{orderIdDisplay}</span>
    </div>
  </div>

  <div class="flex w-full flex-col gap-2.5 lg:gap-2">
    <a
      href={primaryHref}
      class="flex h-11 w-full items-center justify-center rounded-lg border-0 bg-brand text-[15px] font-bold text-white no-underline shadow-[0_8px_10px_rgba(255,90,31,0.15)] hover:opacity-90 lg:h-10 lg:text-[13px]"
    >
      Show in My Tickets
    </a>
    <button
      type="button"
      class="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-paper-border bg-white text-[13px] font-extrabold text-ink hover:border-brand hover:text-brand lg:h-10"
      on:click={shareWithFriends}
    >
      Share with Friends
    </button>
    <a
      href={browseHref}
      class="flex w-full items-center justify-center py-1 text-xs font-extrabold text-brand no-underline hover:opacity-90"
    >
      Back to Browse
    </a>
  </div>

  <div class="flex items-center justify-center gap-1.5 text-ink-secondary">
    <Lock size={12} class="shrink-0" aria-hidden="true" />
    <p class="m-0 text-xs leading-4">Secure Payment · Powered by SOS SEATS</p>
  </div>
</div>
