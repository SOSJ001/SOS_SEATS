<script>
  // @ts-nocheck
  /** Desktop checkout pending card — HI-FI PendingCard 100:289 (+ hifi-density). */
  import Loader from "lucide-svelte/icons/loader";
  import Copy from "lucide-svelte/icons/copy";
  import { showToast } from "$lib/store";

  export let ussdCode = "";
  export let transactionRef = "";
  export let carrier = "Orange Money";
  /** Seconds left before the payment code expires. */
  export let timeRemaining = 0;
  /** Kept for API compatibility; Titles in Figma 100:289 are title-only. */
  export let subtitle = "";
  /** @type {string[]} */
  export let steps = [];
  export let canceling = false;
  /** @type {() => void} */
  export let onCancel = () => {};

  $: timeLabel = formatTime(timeRemaining);

  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  async function copyUssd() {
    if (!ussdCode) return;
    try {
      await navigator.clipboard.writeText(ussdCode);
      showToast("success", "Copied!", "USSD code copied to clipboard");
    } catch {
      showToast("error", "Copy failed", "Could not copy the USSD code.");
    }
  }
</script>

<div
  class="relative z-10 flex w-full max-w-[440px] flex-col items-center gap-5 rounded-2xl border border-paper-border bg-white p-5 shadow-[0_8px_24px_-8px_rgba(18,4,28,0.04)] lg:gap-4 lg:rounded-xl lg:p-4"
>
  <div
    class="flex size-14 items-center justify-center rounded-full border-[3px] border-brand bg-[#faf8f5] lg:size-12"
    aria-hidden="true"
  >
    <Loader size={22} class="animate-spin text-brand lg:hidden" />
    <Loader size={20} class="hidden animate-spin text-brand lg:block" />
  </div>

  <div class="flex w-full flex-col items-center text-center">
    <h2
      class="m-0 text-[22px] font-extrabold text-ink lg:font-display lg:text-xl lg:font-bold"
    >
      Processing Payment...
    </h2>
  </div>

  <div
    class="flex w-full flex-col items-center gap-2.5 rounded-[14px] border-2 border-brand bg-[#fff7ed] px-4 py-3.5 lg:gap-2 lg:px-3 lg:py-2.5"
  >
    <p
      class="m-0 text-[11px] font-bold uppercase tracking-wide text-ink-secondary lg:text-[10px]"
    >
      Your Personal Payment Code
    </p>
    <div class="flex w-full flex-wrap items-center justify-center gap-3 lg:gap-2.5">
      <p
        class="m-0 font-display text-[28px] font-bold text-brand lg:text-2xl"
      >
        {ussdCode}
      </p>
      <button
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-paper-border bg-white px-3.5 py-2.5 text-[13px] font-extrabold text-brand hover:bg-paper lg:gap-1.5 lg:rounded-lg lg:px-2.5 lg:py-1.5 lg:text-[12px]"
        on:click={copyUssd}
      >
        <Copy size={16} class="shrink-0 lg:hidden" />
        <Copy size={14} class="hidden shrink-0 lg:block" />
        Copy
      </button>
    </div>
    <div
      class="flex w-full items-center justify-between gap-3 border-t border-brand/20 pt-2.5 lg:pt-2"
    >
      <span class="text-xs font-bold text-ink-secondary lg:text-[12px]">
        Time Remaining
      </span>
      <span
        class="font-display text-base font-bold tabular-nums text-brand lg:text-[15px]"
        aria-live="polite"
      >
        {timeLabel}
      </span>
    </div>
  </div>

  <div
    class="flex w-full flex-col gap-2.5 py-1 text-[13px] lg:gap-2 lg:text-[12px]"
  >
    <div class="flex items-center justify-between gap-3">
      <span class="text-ink-secondary">Transaction Ref</span>
      <span class="truncate font-bold text-ink">{transactionRef}</span>
    </div>
    <div class="flex items-center justify-between gap-3">
      <span class="text-ink-secondary">Mobile Carrier</span>
      <span class="font-bold text-ink">{carrier}</span>
    </div>
  </div>

  {#if steps?.length}
    <div class="flex w-full flex-col gap-3 lg:gap-2">
      <p class="m-0 text-sm font-extrabold text-ink lg:text-[13px]">
        What to expect next
      </p>
      <ol class="m-0 flex list-none flex-col gap-3 p-0 lg:gap-2">
        {#each steps as step, i}
          <li class="flex items-start gap-3 lg:gap-2.5">
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-[14px] bg-brand text-[13px] font-extrabold text-white lg:size-6 lg:rounded-lg lg:text-[11px]"
            >
              {i + 1}
            </span>
            <p
              class="m-0 text-[13px] leading-[18px] text-ink-secondary lg:text-[12px] lg:leading-snug"
            >
              {step}
            </p>
          </li>
        {/each}
      </ol>
    </div>
  {/if}

  <button
    type="button"
    disabled={canceling}
    class="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-paper-border bg-white text-[13px] font-extrabold text-ink hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50 lg:h-10"
    on:click={onCancel}
  >
    {canceling ? "Canceling…" : "Cancel payment"}
  </button>
</div>
