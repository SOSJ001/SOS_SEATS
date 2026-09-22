<script>
  // @ts-nocheck
  /** Buyer MM checkout failed — Figma FailedCard 787:1598 (+ hifi-density). */
  import X from "lucide-svelte/icons/x";

  export let eventName = "";
  export let amountLabel = "";
  export let reason = "Insufficient balance or timeout";
  export let orderId = "";
  /** @type {() => void} */
  export let onTryAgain = () => {};
  /** @type {() => void} */
  export let onChooseMethod = () => {};
</script>

<div
  class="relative z-10 flex w-full max-w-[440px] flex-col items-center gap-5 rounded-2xl border border-paper-border bg-white p-5 shadow-[0_8px_24px_-8px_rgba(18,4,28,0.04)] lg:gap-4 lg:rounded-xl lg:p-4"
>
  <div
    class="flex size-14 items-center justify-center rounded-full border-[3px] border-[#ef4444] bg-[#faf8f5] lg:size-12"
    aria-hidden="true"
  >
    <X size={22} class="text-[#ef4444] lg:hidden" strokeWidth={2.5} />
    <X size={20} class="hidden text-[#ef4444] lg:block" strokeWidth={2.5} />
  </div>

  <div class="flex w-full flex-col items-center gap-2 text-center lg:gap-1.5">
    <h2
      class="m-0 text-[22px] font-extrabold text-[#ef4444] lg:font-display lg:text-xl lg:font-bold"
    >
      Transaction Declined
    </h2>
    <p
      class="m-0 text-[13px] leading-[18px] text-ink-secondary lg:text-[12px] lg:leading-snug"
    >
      We were unable to process your transaction.
    </p>
  </div>

  <div
    class="flex w-full flex-col gap-2.5 py-1 text-[13px] lg:gap-2 lg:py-2 lg:text-[12px]"
  >
    <div class="flex items-center justify-between gap-3">
      <span class="text-ink-secondary">Event</span>
      <span class="truncate text-right font-bold text-ink">{eventName}</span>
    </div>
    <div class="flex items-center justify-between gap-3">
      <span class="text-ink-secondary">Amount</span>
      <span class="font-bold text-ink">{amountLabel}</span>
    </div>
    <div class="flex items-center justify-between gap-3">
      <span class="text-ink-secondary">Reason</span>
      <span class="truncate text-right font-bold text-brand">{reason}</span>
    </div>
    <div class="flex items-center justify-between gap-3">
      <span class="text-ink-secondary">Order ID</span>
      <span class="font-bold text-ink">{orderId}</span>
    </div>
  </div>

  <div
    class="flex w-full flex-col gap-2.5 rounded-xl border-[1.5px] border-paper-border bg-[#faf8f5] px-4 py-3.5 lg:gap-2 lg:rounded-lg lg:px-3 lg:py-2.5"
  >
    <p class="m-0 text-[13px] font-extrabold text-ink lg:text-[12px]">
      Helpful note
    </p>
    <p
      class="m-0 text-xs leading-[18px] text-ink-secondary lg:text-[11px] lg:leading-snug"
    >
      Please ensure your mobile wallet has sufficient funds and make sure to
      authorize the payment prompt within 60 seconds of receiving it.
    </p>
  </div>

  <div class="flex w-full flex-col gap-3 lg:gap-2.5">
    <button
      type="button"
      class="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border-0 bg-brand text-sm font-extrabold text-white hover:opacity-90 lg:h-10 lg:text-[13px]"
      on:click={onTryAgain}
    >
      Try Again
    </button>

    <div class="flex w-full items-center gap-2.5">
      <span class="h-px flex-1 bg-paper-border" aria-hidden="true"></span>
      <span class="text-xs font-bold text-ink-secondary">or</span>
      <span class="h-px flex-1 bg-paper-border" aria-hidden="true"></span>
    </div>

    <button
      type="button"
      class="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-brand bg-white text-sm font-extrabold text-brand hover:bg-[#fff7ed] lg:h-10 lg:text-[13px]"
      on:click={onChooseMethod}
    >
      Choose Different Method
    </button>
  </div>

  <p class="m-0 text-center text-xs leading-4 text-ink-secondary">
    Need help? Contact support at
    <a
      href="mailto:support@sosseats.com"
      class="font-semibold text-ink-secondary underline decoration-paper-border underline-offset-2 hover:text-brand"
    >
      support@sosseats.com
    </a>
  </p>
</div>
