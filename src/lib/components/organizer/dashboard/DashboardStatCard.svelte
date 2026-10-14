<script>
  // @ts-nocheck
  /**
   * Dashboard stat card (HI-FI 55:857 desktop, 469:80 mobile).
   */
  export let label = "";
  /** @type {string | number} */
  export let value = "";
  export let pill = "";
  /** Lucide icon component. */
  export let icon = null;
  /** "brand" | "green" | "blue" */
  export let tone = "brand";

  const GREEN_PILL = "bg-[rgba(34,197,94,0.1)] text-[#22c55e]";
  const TONES = {
    brand: {
      bg: "bg-[#fff4ed]",
      bar: "bg-brand",
      icon: "text-brand",
      pill: "bg-[rgba(255,90,31,0.1)] text-brand lg:bg-[rgba(34,197,94,0.1)] lg:text-[#22c55e]",
    },
    green: { bg: "bg-accent-green-soft", bar: "bg-[#22c55e]", icon: "text-[#22c55e]", pill: GREEN_PILL },
    blue: { bg: "bg-[#f0f9ff]", bar: "bg-[#3b82f6]", icon: "text-[#3b82f6]", pill: GREEN_PILL },
  };

  $: t = TONES[tone] || TONES.brand;
</script>

<div
  class="flex min-w-0 flex-col gap-2 rounded-xl border border-paper-border p-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.05)] lg:gap-3 lg:p-5 {t.bg}"
>
  <div class="flex items-center justify-between gap-3">
    <div class="flex min-w-0 items-center gap-3">
      <div class="h-10 w-1 shrink-0 rounded-sm {t.bar}"></div>
      <p
        class="m-0 truncate text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-secondary lg:text-[13px] lg:normal-case lg:tracking-normal"
      >
        {label}
      </p>
    </div>
    {#if pill}
      <span
        class="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold lg:text-[11px] {t.pill}"
      >
        {pill}
      </span>
    {/if}
  </div>
  <div class="flex min-w-0 items-center gap-2.5">
    <p class="m-0 truncate text-[28px] font-extrabold leading-tight text-ink lg:text-[34px]">
      {value}
    </p>
    {#if icon}
      <svelte:component this={icon} class="size-[18px] shrink-0 {t.icon}" aria-hidden="true" />
    {/if}
  </div>
</div>
