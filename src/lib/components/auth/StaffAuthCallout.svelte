<script>
  // @ts-nocheck
  /** Staff sign-in callout (HI-FI 739:1340 help, 1540:6018 / 1540:6068 error). */
  import Info from "lucide-svelte/icons/info";

  /** `"help"` | `"error"` */
  export let tone = "help";

  $: isError = tone === "error";
</script>

<div
  class="flex w-full items-center gap-3 rounded-xl border p-4 lg:items-start lg:gap-1.5 {isError
    ? 'border-red-500/35 bg-red-500/[0.08] text-[#b91c1c]'
    : 'border-[#fcd34d] bg-[#fffbeb] text-[#b45309]'}"
  role={isError ? "alert" : undefined}
>
  <span
    class="flex size-7 shrink-0 items-center justify-center rounded-lg {isError
      ? 'bg-red-500/[0.12]'
      : 'bg-[#fef3c7]'}"
    aria-hidden="true"
  >
    <Info size={16} />
  </span>
  <p class="m-0 min-w-0 flex-1 text-[13px] leading-[18px]">
    <slot />
  </p>
</div>
