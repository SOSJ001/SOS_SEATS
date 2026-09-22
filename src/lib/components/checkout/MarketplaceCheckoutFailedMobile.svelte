<script>
  // @ts-nocheck
  /** Mobile checkout failed — HI-FI checkout-failed 281:110. */
  import X from "lucide-svelte/icons/x";

  export let eventName = "";
  export let amountLabel = "";
  export let reason = "Insufficient balance or timeout";
  export let orderId = "";
  /** @type {() => void} */
  export let onTryAgain = () => {};
  /** @type {() => void} */
  export let onChooseMethod = () => {};

  $: orderIdDisplay = orderId?.startsWith("#")
    ? orderId
    : `#${orderId || "—"}`;
</script>

<div class="flex min-h-full flex-col bg-[#faf8f5]">
  <div class="flex w-full flex-col items-center gap-5 p-6">
    <div
      class="flex size-16 items-center justify-center rounded-full border-2 border-[#f04545] bg-[#faf9f7]"
      aria-hidden="true"
    >
      <X size={24} class="text-[#f04545]" strokeWidth={2.5} />
    </div>

    <div
      class="flex w-full flex-col gap-4 rounded-[14px] border-[1.5px] border-paper-border bg-white p-5 shadow-[0_6px_8px_rgba(0,0,0,0.06)]"
    >
      <div class="flex w-full flex-col gap-1">
        <h1 class="m-0 text-[22px] font-extrabold text-[#ef4444]">
          Transaction Declined
        </h1>
        <p class="m-0 text-[13px] text-ink-secondary">
          We were unable to process your transaction.
        </p>
      </div>

      <div class="flex w-full flex-col gap-3 text-[13px]">
        <div class="flex items-start justify-between gap-3">
          <span class="text-ink-secondary">Event</span>
          <span class="max-w-[180px] truncate text-right font-bold text-ink">
            {eventName}
          </span>
        </div>
        <div class="flex items-start justify-between gap-3">
          <span class="text-ink-secondary">Amount</span>
          <span class="font-bold text-ink">{amountLabel}</span>
        </div>
        <div class="flex items-start justify-between gap-3">
          <span class="text-ink-secondary">Reason</span>
          <span class="max-w-[200px] text-right text-[#ef4444]">{reason}</span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="font-medium text-ink-secondary">Order ID</span>
          <span class="font-bold text-ink">{orderIdDisplay}</span>
        </div>
      </div>

      <div
        class="flex w-full flex-col gap-2 overflow-hidden rounded-xl border border-paper-border bg-[#faf9f7] px-4 py-3"
      >
        <p class="m-0 text-[13px] font-extrabold text-ink">Helpful note</p>
        <p class="m-0 text-xs leading-[1.4] text-ink-secondary">
          Please ensure your mobile wallet has sufficient funds and make sure to
          authorize the payment prompt within 60 seconds of receiving it.
        </p>
      </div>
    </div>

    <button
      type="button"
      class="flex w-full cursor-pointer items-center justify-center rounded-xl border-0 bg-brand px-6 py-4 text-sm font-extrabold text-white shadow-[0_4px_8px_rgba(255,90,31,0.25)] hover:opacity-90"
      on:click={onTryAgain}
    >
      Try Again
    </button>

    <div class="flex w-full items-center justify-center gap-4">
      <span class="h-px flex-1 bg-[#e8e3de]" aria-hidden="true"></span>
      <span class="text-[13px] font-medium text-ink-secondary">or</span>
      <span class="h-px flex-1 bg-[#e8e3de]" aria-hidden="true"></span>
    </div>

    <button
      type="button"
      class="flex w-full cursor-pointer items-center justify-center rounded-xl border border-brand bg-white px-6 py-3.5 text-sm font-extrabold text-brand hover:bg-[#fff7ed]"
      on:click={onChooseMethod}
    >
      Choose Different Method
    </button>

    <p class="m-0 w-full pt-2 text-center text-xs leading-[1.4] text-ink-secondary">
      Need help? Contact support at
      <a
        href="mailto:support@sosseats.com"
        class="text-ink-secondary no-underline hover:text-brand"
      >
        support@sosseats.com
      </a>
    </p>
  </div>
</div>
