<script>
  // @ts-nocheck
  /**
   * Permanent-transfer warning.
   * default: Transfers list, desktop 604:1617 / mobile 624:1446.
   * form: Transfer form, desktop 609:1375 / mobile 36:923.
   */
  import TriangleAlert from "lucide-svelte/icons/triangle-alert";
  import Shield from "lucide-svelte/icons/shield";

  /** @type {"default" | "form"} */
  export let variant = "default";
</script>

{#if variant === "form"}
  <div
    class="flex w-full flex-col gap-1.5 rounded-lg border border-solid border-brand bg-gradient-to-r from-[#fff0ea] to-[#ffd9c5] p-3 lg:flex-row lg:items-center lg:gap-3"
    role="note"
  >
    <div class="flex items-center gap-2 lg:hidden">
      <span
        class="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/[0.07] text-brand"
        aria-hidden="true"
      >
        <Shield size={16} strokeWidth={3} />
      </span>
      <p class="m-0 flex-1 text-xs font-bold text-brand">ATTENTION: Permanent Action</p>
    </div>
    <p class="m-0 text-xs leading-4 text-ink lg:hidden">
      This transfer cannot be undone. Once sent, the original QR code is instantly deactivated
      and a fresh valid QR is issued to the recipient.
    </p>

    <span
      class="hidden size-8 shrink-0 items-center justify-center rounded-full bg-brand/[0.07] text-brand lg:flex"
      aria-hidden="true"
    >
      <Shield size={16} strokeWidth={3} />
    </span>
    <p class="m-0 hidden flex-1 text-[13px] font-medium text-brand lg:block">
      <strong class="font-bold">Important:</strong> Transfers are automatic and permanent. The
      original QR code will be deactivated instantly and a new one issued to the recipient.
    </p>
  </div>
{:else}
  <div
    class="flex items-start gap-2.5 rounded-lg border border-solid border-brand bg-[#fff0ea] p-3 text-brand lg:items-center lg:gap-3 lg:px-4"
    role="note"
  >
    <span
      class="flex h-[18px] shrink-0 items-center justify-center rounded-[9px] bg-brand text-xs font-bold text-white lg:hidden"
      aria-hidden="true"
    >
      !
    </span>
    <TriangleAlert size={18} class="hidden shrink-0 lg:block" aria-hidden="true" />
    <p class="m-0 flex-1 text-xs font-medium lg:text-[13px]">
      <strong class="font-medium lg:font-bold">Important:</strong> Transfers are permanent. The original QR
      code will be deactivated and a new one issued to the recipient.
    </p>
  </div>
{/if}
