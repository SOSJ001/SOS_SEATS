<script>
  // @ts-nocheck
  /**
   * Events list stat tile (HI-FI 55:965 desktop, 4:651 mobile 2x2).
   */
  /** @type {string} */
  export let label = "";
  /** @type {number | string} */
  export let value = 0;
  /** Desktop-only sub-line. */
  export let sub = "";
  /** Lucide icon component. */
  export let icon = null;
  /** "brand" | "success" | "warning" | "error" */
  export let tone = "brand";

  const TONES = {
    brand: { bg: "bg-[#fff4ed]", bar: "bg-brand", text: "text-brand" },
    success: { bg: "bg-accent-green-soft", bar: "bg-[#00e676]", text: "text-[#00e676]" },
    warning: { bg: "bg-[#fef3c7]", bar: "bg-[#f59e0b]", text: "text-[#f59e0b]" },
    error: { bg: "bg-[#fef2f2]", bar: "bg-[#ff1744]", text: "text-[#ff1744]" },
  };

  $: t = TONES[tone] || TONES.brand;
</script>

<div
  class="flex h-20 min-w-0 items-center gap-3 rounded-xl border border-paper-border p-3 drop-shadow-[0_4px_6px_rgba(0,0,0,0.03)] lg:h-24 lg:gap-4 lg:rounded-2xl lg:p-5 {t.bg}"
>
  <div class="h-full w-1 shrink-0 rounded-sm lg:w-[5px] {t.bar}"></div>
  <div class="flex min-w-0 flex-1 flex-col gap-0.5 lg:gap-1">
    <div class="flex items-center gap-1.5 lg:gap-2">
      {#if icon}
        <svelte:component this={icon} class="size-4 shrink-0 lg:size-6 {t.text}" aria-hidden="true" />
      {/if}
      <p class="m-0 text-[18px] font-extrabold leading-none lg:text-[36px] {t.text}">{value}</p>
    </div>
    <p
      class="m-0 truncate text-[10px] font-semibold uppercase tracking-[0.8px] text-[#666673] lg:text-[13px]"
    >
      {label}
    </p>
    {#if sub}
      <p class="m-0 hidden truncate text-[13px] text-ink-secondary lg:block">{sub}</p>
    {/if}
  </div>
</div>
