<script>
  // @ts-nocheck
  /** Mobile checkout pending — HI-FI checkout-pending 4:454. */
  import Loader from "lucide-svelte/icons/loader";
  import ShieldCheck from "lucide-svelte/icons/shield-check";

  export let ussdCode = "";
  export let timeRemaining = 0;
  export let carrier = "Orange Money";
  export let amountLabel = "";
  export let orderRef = "";
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
</script>

<div class="flex min-h-full flex-col bg-[#faf8f5]">
  <div
    class="flex items-center justify-between px-5 py-3"
  >
    <h1 class="m-0 text-xl font-extrabold text-ink">Payment Pending</h1>
    {#if orderRef}
      <span
        class="rounded-full border border-paper-border bg-white px-2.5 py-1.5 text-[10px] font-bold text-ink-secondary"
      >
        {orderRef}
      </span>
    {/if}
  </div>

  <div
    class="flex w-full flex-col items-center gap-5 px-5 pb-6 pt-2"
  >
    <div
      class="flex size-16 items-center justify-center rounded-full border-2 border-brand bg-[#faf9f7]"
      aria-hidden="true"
    >
      <Loader size={24} class="animate-spin text-brand" />
    </div>

    <div
      class="flex w-full flex-col items-center gap-2 rounded-[14px] border border-brand bg-[#fff5f0] px-4 py-3.5"
    >
      <p
        class="m-0 text-[11px] font-bold uppercase tracking-wide text-ink-secondary"
      >
        Your Personal Payment Code
      </p>
      <p class="m-0 font-display text-[32px] font-bold text-brand">
        {ussdCode}
      </p>
      <div
        class="flex w-full items-center justify-between gap-3 border-t border-brand/20 pt-2.5"
      >
        <span class="text-[13px] font-bold text-ink-secondary">
          Time Remaining
        </span>
        <span
          class="font-display text-base font-bold tabular-nums text-brand"
          aria-live="polite"
        >
          {timeLabel}
        </span>
      </div>
    </div>

    <div class="flex w-full flex-col items-center gap-3 text-center">
      <p class="m-0 text-base font-extrabold text-ink">
        Dial Code to Authorize Transaction
      </p>
      <p class="m-0 text-[13px] leading-normal text-ink-secondary">
        Dial the prompt code above on your device and input your PIN code to
        authorize the {carrier} transaction of {amountLabel}.
      </p>
    </div>

    <div
      class="flex items-center gap-2 rounded-full border border-brand bg-[#fff5f0] px-4 py-2"
    >
      <span
        class="size-2 shrink-0 rounded-full bg-brand"
        aria-hidden="true"
      ></span>
      <p class="m-0 text-[13px] font-semibold text-ink">
        Waiting for mobile network response...
      </p>
    </div>

    <div
      class="flex w-full flex-col gap-2 rounded-xl border border-paper-border bg-[#faf9f7] px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <ShieldCheck size={18} class="shrink-0 text-[#0FBA82]" />
        <p class="m-0 text-[13px] font-extrabold text-ink">Helpful tip</p>
      </div>
      <p class="m-0 text-xs leading-[1.45] text-ink-secondary">
        You can close this tab or lock your phone. The server creates the order
        even if you leave. Once payment is confirmed, open My Tickets and tap
        Show entry QR.
      </p>
    </div>

    <button
      type="button"
      disabled={canceling}
      class="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-paper-border bg-white text-[15px] font-extrabold text-ink hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
      on:click={onCancel}
    >
      {canceling ? "Canceling…" : "Cancel payment"}
    </button>
  </div>
</div>
