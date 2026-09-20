<script>
  // @ts-nocheck
  /** Wallet-issue success panel — desktop HI-FI 527:798 / mobile HI-FI 389:125. */
  import Check from "lucide-svelte/icons/check";

  export let headline = "Tickets Issued Successfully";
  export let subtitle = "";
  export let bannerText = "";
  export let eventName = "";
  export let ticketsLabel = "";
  export let amountLabel = "";
  export let paymentMethod = "Wallet Balance";
  export let timestamp = "";
  export let primaryLabel = "View Guest List";
  export let primaryHref = "#";
  export let secondaryLabel = "Issue More Tickets";
  export let secondaryHref = "#";
</script>

<div
  class="relative z-10 flex w-full max-w-[440px] flex-col gap-4 lg:gap-3"
>
  <div class="flex flex-col items-center gap-3 text-center lg:gap-3">
    <div
      class="flex size-24 items-center justify-center rounded-full border-2 border-[#22c55e] bg-[#ecfdf5] shadow-[0_0_12px_rgba(34,197,94,0.12)] lg:size-16 lg:border-[3px] lg:bg-[#dcfce7] lg:shadow-none"
      aria-hidden="true"
    >
      <div
        class="flex size-20 items-center justify-center rounded-full border-2 border-[#22c55e] bg-white lg:size-auto lg:border-0 lg:bg-transparent"
      >
        <Check
          size={32}
          class="text-[#22c55e] lg:hidden"
          strokeWidth={3}
        />
        <Check
          size={28}
          class="hidden text-[#16a34a] lg:block"
          strokeWidth={3}
        />
      </div>
    </div>
    <div class="flex w-full flex-col gap-1.5 lg:gap-1">
      <h2
        class="m-0 text-[22px] font-extrabold text-ink lg:font-display lg:text-xl lg:font-bold"
      >
        {headline}
      </h2>
      {#if subtitle}
        <p
          class="m-0 text-[13px] font-medium leading-snug text-ink-secondary lg:text-[12px] lg:font-normal"
        >
          {subtitle}
        </p>
      {/if}
    </div>
  </div>

  {#if bannerText}
    <div
      class="flex w-full items-center gap-3 rounded-2xl border border-[#22c55e] bg-[#ecfdf5] p-4 text-left lg:gap-2.5 lg:rounded-xl lg:border-[#86efac] lg:bg-[#dcfce7] lg:px-3 lg:py-2.5"
    >
      <span
        class="flex size-8 shrink-0 items-center justify-center rounded-2xl bg-[rgba(34,197,94,0.12)] text-[#22c55e] lg:size-7 lg:rounded-full lg:bg-[#22c55e] lg:text-white"
        aria-hidden="true"
      >
        <Check size={16} class="lg:hidden" strokeWidth={3} />
        <Check size={14} class="hidden lg:block" strokeWidth={3} />
      </span>
      <p class="m-0 text-sm font-bold text-ink lg:text-[12px]">{bannerText}</p>
    </div>
  {/if}

  <div
    class="flex flex-col gap-3 rounded-2xl border-[1.5px] border-paper-border bg-white p-5 shadow-[0_8px_12px_rgba(18,4,28,0.04)] lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:p-0 lg:shadow-sm"
  >
    <p
      class="m-0 text-base font-extrabold text-ink lg:border-b lg:border-paper-border lg:px-3.5 lg:py-2.5 lg:text-[13px]"
    >
      Transaction Details
    </p>
    <div class="h-px w-full bg-paper-border lg:hidden"></div>
    <div
      class="flex items-center justify-between gap-3 text-[13px] lg:border-b lg:border-paper-border lg:px-3.5 lg:py-2.5 lg:text-[12px]"
    >
      <span class="text-ink-secondary">Event</span>
      <span class="truncate text-right font-bold text-ink">{eventName}</span>
    </div>
    <div class="h-px w-full bg-paper-border lg:hidden"></div>
    <div
      class="flex items-center justify-between gap-3 text-[13px] lg:border-b lg:border-paper-border lg:px-3.5 lg:py-2.5 lg:text-[12px]"
    >
      <span class="text-ink-secondary">Tickets Issued</span>
      <span class="font-bold text-ink">{ticketsLabel}</span>
    </div>
    <div class="h-px w-full bg-paper-border lg:hidden"></div>
    <div
      class="flex items-center justify-between gap-3 text-[13px] lg:border-b lg:border-paper-border lg:px-3.5 lg:py-2.5 lg:text-[12px]"
    >
      <span class="text-ink-secondary">Amount Deducted</span>
      <span class="font-extrabold text-brand lg:font-bold">{amountLabel}</span>
    </div>
    <div class="h-px w-full bg-paper-border lg:hidden"></div>
    <div
      class="flex items-center justify-between gap-3 text-[13px] lg:border-b lg:border-paper-border lg:px-3.5 lg:py-2.5 lg:text-[12px]"
    >
      <span class="text-ink-secondary">Payment Method</span>
      <span class="font-bold text-ink">{paymentMethod}</span>
    </div>
    <div class="h-px w-full bg-paper-border lg:hidden"></div>
    <div
      class="flex items-center justify-between gap-3 text-[13px] lg:px-3.5 lg:py-2.5 lg:text-[12px]"
    >
      <span class="text-ink-secondary">Timestamp</span>
      <span class="font-normal text-ink lg:font-bold">{timestamp}</span>
    </div>
  </div>

  <div class="flex flex-col gap-3 lg:flex-row lg:gap-2">
    <a
      href={primaryHref}
      class="flex w-full items-center justify-center rounded-xl border-0 bg-brand px-6 py-4 text-[15px] font-bold text-white no-underline shadow-[0_8px_10px_rgba(255,90,31,0.15)] hover:opacity-90 lg:h-9 lg:flex-1 lg:rounded-lg lg:px-3 lg:py-0 lg:text-[13px] lg:shadow-[0_6px_8px_rgba(255,90,31,0.15)]"
    >
      {primaryLabel}
    </a>
    <p
      class="m-0 text-center text-[13px] text-ink-secondary lg:hidden"
    >
      or
    </p>
    <a
      href={secondaryHref}
      class="flex w-full items-center justify-center rounded-xl border-2 border-brand bg-white px-6 py-4 text-[15px] font-bold text-brand no-underline hover:opacity-90 lg:h-9 lg:flex-1 lg:rounded-lg lg:border lg:border-paper-border lg:px-3 lg:py-0 lg:text-[13px] lg:text-ink lg:hover:border-brand lg:hover:text-brand"
    >
      {secondaryLabel}
    </a>
  </div>
</div>
