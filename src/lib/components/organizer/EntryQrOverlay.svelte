<script>
  // @ts-nocheck
  /** Entry QR overlay — desktop HI-FI 199:193 / mobile HI-FI 208:148; card via TicketLivePreview 571:110. */
  import { onMount } from "svelte";
  import X from "lucide-svelte/icons/x";
  import TicketLivePreview from "./TicketLivePreview.svelte";
  import { guestTicketCardProps } from "$lib/client/ticketLayout";
  import { exportTicketCardPng } from "$lib/client/exportTicketCard";
  import { downloadImage, shareImageDataUrl } from "$lib/store";

  /** @type {any} */
  export let event = null;
  /** @type {any} */
  export let guest = null;
  export let open = false;

  $: cardProps = guestTicketCardProps(event, guest);
  // No token, no ticket: never show or export a card without the real QR
  $: hasToken = Boolean(guest?.qrToken);

  function close() {
    open = false;
  }

  function onKey(e) {
    if (e.key === "Escape") close();
  }

  onMount(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function buildImage() {
    if (!hasToken) return "";
    if (document.fonts?.ready) await document.fonts.ready;
    return exportTicketCardPng({ ...cardProps, scale: 1.5 });
  }

  export async function download() {
    const url = await buildImage();
    if (url) {
      downloadImage(url, `ticket-${guest?.ticketNumber || guest?.id || "guest"}.png`);
    }
  }

  export async function share() {
    const url = await buildImage();
    if (url) {
      await shareImageDataUrl({
        dataUrl: url,
        filename: `ticket-${guest?.ticketNumber || "guest"}.png`,
        title: event?.title || "Ticket",
        text: `Entry ticket for ${guest?.name || "guest"}`,
      });
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Entry QR"
  >
    <button
      type="button"
      class="absolute inset-0 cursor-pointer border-0 bg-transparent"
      aria-label="Close"
      on:click={close}
    ></button>
    <!-- Mobile 208:148: close above ticket; desktop 199:193: outside X -->
    <div
      class="relative z-10 flex max-h-[90vh] w-full max-w-[358px] flex-col items-end gap-2 overflow-y-auto lg:w-[420px] lg:max-w-full lg:gap-3"
    >
      <button
        type="button"
        class="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-ink shadow-lg lg:size-10"
        aria-label="Close overlay"
        on:click={close}
      >
        <X size={16} class="lg:hidden" />
        <X size={20} class="hidden lg:block" />
      </button>
      {#if hasToken}
        <div class="w-full shrink-0">
          <TicketLivePreview {...cardProps} />
        </div>
      {:else}
        <div
          class="flex h-80 w-full items-center justify-center rounded-2xl bg-paper text-sm text-ink-secondary"
        >
          Could not generate ticket preview.
        </div>
      {/if}
    </div>
  </div>
{/if}
