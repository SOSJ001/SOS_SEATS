<script>
  // @ts-nocheck
  /**
   * Free claim success card — Figma SuccessCard 1161:2959.
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
  export let ticketTypes = [{ name: "Free" }];
  export let ticketCount = 1;
  export let orderNumber = "";
  /** @type {Record<string, any> | null} */
  export let ticketDesignConfig = null;
  export let qrData = "";
  export let shareUrl = "/marketplace";
  export let primaryHref = "/dashboard/my-tickets";
  export let browseHref = "/marketplace";

  $: ticketWord = ticketCount === 1 ? "ticket" : "tickets";
  $: statusLine = `${ticketCount} free ${ticketWord} claimed for ${eventName}`;
  $: subcopy =
    ticketCount === 1
      ? "Your free ticket has been claimed. Check in with your QR code at the door."
      : "Your free tickets have been claimed. Check in with your QR code at the door.";
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

<div
  class="relative z-10 flex w-full max-w-[480px] flex-col items-center gap-4 rounded-[20px] border border-paper-border bg-white p-6 shadow-[0_0_40px_rgba(255,90,31,0.05),0_8px_24px_rgba(18,4,28,0.04)]"
>
  <div class="flex w-full flex-col items-center gap-2.5 text-center">
    <div
      class="flex size-[72px] items-center justify-center rounded-[36px] border-[2.5px] border-[#22c55e] bg-[#ecfdf5] shadow-[0_0_12px_rgba(34,197,94,0.2)]"
      aria-hidden="true"
    >
      <div
        class="flex size-14 items-center justify-center rounded-[28px] border-2 border-[#22c55e] bg-white"
      >
        <Check size={24} class="text-[#22c55e]" strokeWidth={3} />
      </div>
    </div>
    <div class="flex w-full flex-col gap-1.5">
      <h2 class="m-0 text-[26px] font-extrabold text-ink">Ticket Claimed!</h2>
      <p class="m-0 text-[13px] leading-[18px] text-ink-secondary">{subcopy}</p>
    </div>
    <div class="flex flex-wrap items-center justify-center gap-1.5">
      <span
        class="rounded bg-[#f5f5f5] px-2 py-1 text-[11px] font-extrabold text-[#22c55e]"
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

  <div class="flex w-full flex-col gap-2.5">
    <a
      href={primaryHref}
      class="flex h-11 w-full items-center justify-center rounded-lg border-0 bg-brand text-[15px] font-bold text-white no-underline shadow-[0_8px_10px_rgba(255,90,31,0.15)] hover:opacity-90"
    >
      Show in My Tickets
    </a>
    <button
      type="button"
      class="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-paper-border bg-white text-[13px] font-extrabold text-ink hover:border-brand hover:text-brand"
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
