<script>
  // @ts-nocheck
  /**
   * Transfer result note (TransferFooterMessage).
   * success: desktop 527:409, mobile 680:1517. failed: desktop 680:1420, mobile 680:1531.
   */
  import Check from "lucide-svelte/icons/check";
  import X from "lucide-svelte/icons/x";

  /** @type {"success" | "failed"} */
  export let variant = "success";

  $: failed = variant === "failed";
</script>

<div
  class="flex items-center gap-3 rounded-xl border p-4 lg:p-3 {failed
    ? 'border-[#ef4444] bg-[#fef2f2]'
    : 'border-[#22c55e] bg-[#d9f2e0]'}"
>
  <span
    class="flex size-8 shrink-0 items-center justify-center rounded-full {failed
      ? 'bg-[rgba(239,68,68,0.12)] text-[#ef4444]'
      : 'bg-[rgba(34,197,94,0.12)] text-[#22c55e]'}"
    aria-hidden="true"
  >
    {#if failed}
      <X size={16} strokeWidth={3} />
    {:else}
      <Check size={16} strokeWidth={3} />
    {/if}
  </span>
  <div class="flex min-w-0 flex-1 flex-col gap-0.5">
    {#if failed}
      <p class="m-0 text-sm font-bold leading-[18px] text-ink lg:leading-5">Transfer Failed</p>
      <p class="m-0 text-xs leading-[15px] text-ink-secondary lg:leading-4">
        Your ticket has not been transferred. No changes were made to your account.
      </p>
    {:else}
      <p class="m-0 text-sm font-bold leading-[18px] text-ink lg:leading-5">
        Transfer Complete
      </p>
      <p class="m-0 text-[13px] leading-4 text-ink-secondary lg:text-xs">
        Your original QR is deactivated. The recipient gets a fresh QR code.
      </p>
    {/if}
  </div>
</div>
