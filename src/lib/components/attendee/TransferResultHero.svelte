<script>
  // @ts-nocheck
  /**
   * Transfer result hero: "Transfer Successful" desktop 527:384 (dense per hifi-density), mobile 680:1462.
   * failed: Transfer Failed hero desktop 659:1345 (frame 527:546), mobile 313:92 (own copy).
   */
  import Check from "lucide-svelte/icons/check";
  import X from "lucide-svelte/icons/x";

  /** @type {"success" | "failed"} */
  export let variant = "success";
</script>

{#if variant === "success"}
  <section
    class="flex w-full max-w-[640px] flex-col items-center gap-5 rounded-[20px] border border-paper-border bg-gradient-to-r from-brand-soft to-[#d9f2e0] p-8 text-center shadow-[0_8px_12px_rgba(18,4,28,0.04)] lg:gap-3 lg:to-[#fffbf5] lg:p-4"
  >
    <span
      class="flex size-[72px] shrink-0 items-center justify-center rounded-full border-2 border-[#22c55e] bg-[rgba(34,197,94,0.12)] text-[#22c55e] lg:size-12"
      aria-hidden="true"
    >
      <Check size={32} strokeWidth={1.5} class="size-8 lg:size-6 lg:stroke-2" />
    </span>
    <div class="-mx-5 flex flex-col items-center gap-1.5 lg:mx-0">
      <h1 class="m-0 text-2xl font-extrabold leading-tight text-ink lg:leading-8">
        Transfer Successful
      </h1>
      <p class="m-0 text-[15px] leading-[19px] text-ink-secondary lg:text-sm">
        Your ticket has been securely transferred to the recipient.
      </p>
    </div>
  </section>
{:else if variant === "failed"}
  <section
    class="flex w-full max-w-[640px] flex-col items-center gap-3 rounded-[20px] border border-paper-border bg-gradient-to-r from-[#fff1f1] to-[#fee2e2] px-8 pb-8 pt-10 text-center shadow-[0_8px_12px_rgba(18,4,28,0.04)] lg:rounded-2xl lg:border-[rgba(239,68,68,0.2)] lg:from-[#fff0f0] lg:to-[#ffe0e0] lg:p-4 lg:shadow-[0_10px_14px_rgba(18,4,28,0.08)]"
  >
    <span
      class="flex size-20 shrink-0 items-center justify-center rounded-full border-2 border-[#ef4444] bg-[rgba(239,68,68,0.12)] text-[#ef4444] lg:size-14"
      aria-hidden="true"
    >
      <X size={32} strokeWidth={1.5} class="size-8 lg:[stroke-width:1.6]" />
    </span>
    <div class="flex flex-col items-center gap-3 lg:gap-1.5">
      <h1
        class="m-0 text-2xl font-bold leading-tight text-[#d92e2e] lg:font-extrabold lg:text-[#ef4444]"
      >
        Transfer Failed
      </h1>
      <p class="m-0 text-sm leading-[18px] text-[#737380] lg:leading-5 lg:text-ink-secondary">
        <span class="lg:hidden">We were unable to complete your ticket transfer.</span>
        <span class="hidden lg:inline"
          >We couldn't complete the transfer. Please check the recipient details and try again.</span
        >
      </p>
    </div>
  </section>
{/if}
