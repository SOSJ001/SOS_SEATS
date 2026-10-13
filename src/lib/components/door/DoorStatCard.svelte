<script>
  // @ts-nocheck
  /**
   * Door stat card (roadmap 7.2).
   * layout "summary": Door events KPI (530:289 716:1337).
   * layout "bar": scanner ready stats (55:2244 118:313).
   * layout "compact": scanner result stats (55:2275 55:2300).
   */
  export let label = "";
  export let value = "";
  export let caption = "";
  /** lucide-svelte icon component (summary layout) */
  export let icon = null;
  /** "green" | "orange" | "blue" | "slate" */
  export let tone = "orange";
  export let layout = "bar";
  /** Overrides the tone's value colour (e.g. Total Guests uses ink). */
  export let valueClass = "";

  const TONES = {
    green: {
      bg: "bg-accent-green-soft",
      border: "border-[#a7f3d0]",
      bar: "bg-[#16a34a]",
      label: "text-[#16a34a]",
      value: "text-[#16a34a]",
    },
    orange: {
      bg: "bg-[#fff4ed]",
      border: "border-[#ffd7c2]",
      bar: "bg-brand",
      label: "text-brand",
      value: "text-brand",
    },
    blue: {
      bg: "bg-[#f0f9ff]",
      border: "border-[#bfdbfe]",
      bar: "bg-accent-blue",
      label: "text-accent-blue",
      value: "text-accent-blue",
    },
    slate: {
      bg: "bg-[#f8fafc]",
      border: "border-[#e2e8f0]",
      bar: "bg-[#94a3b8]",
      label: "text-ink-secondary",
      value: "text-ink-secondary",
    },
  };

  $: t = TONES[tone] || TONES.orange;
  $: valueColor = valueClass || t.value;
</script>

{#if layout === "summary"}
  <div
    class="flex flex-1 min-w-0 items-stretch gap-4 rounded-2xl border border-paper-border p-4 shadow-[0_4px_6px_rgba(0,0,0,0.03)] {t.bg}"
  >
    <div class="w-[5px] shrink-0 rounded {t.bar}" aria-hidden="true"></div>
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <div class="flex items-center gap-2.5">
        {#if icon}
          <svelte:component
            this={icon}
            class="size-5 shrink-0 {valueColor}"
            aria-hidden="true"
          />
        {/if}
        <p class="m-0 text-2xl font-extrabold leading-none {valueColor}">{value}</p>
      </div>
      <p class="m-0 text-xs font-bold uppercase tracking-[0.8px] text-[#666673]">{label}</p>
      {#if caption}
        <p class="m-0 text-[13px] font-semibold text-ink-secondary">{caption}</p>
      {/if}
    </div>
  </div>
{:else if layout === "compact"}
  <div
    class="flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-paper-border bg-paper p-4 shadow-[0_2px_4px_rgba(0,0,0,0.03),0_12px_14px_rgba(0,0,0,0.08)]"
  >
    <div class="flex w-full items-center gap-2">
      <span class="size-2 shrink-0 rounded {t.bar}" aria-hidden="true"></span>
      <p class="m-0 truncate text-xs font-bold uppercase tracking-[0.8px] {t.label}">{label}</p>
    </div>
    <p class="m-0 font-display text-2xl font-bold leading-tight {valueColor}">
      {value}
    </p>
  </div>
{:else}
  <div
    class="flex w-full items-center gap-4 rounded-2xl border p-4 shadow-[0_8px_10px_rgba(0,0,0,0.05)] {t.bg} {t.border}"
  >
    <div class="w-1.5 shrink-0 self-stretch rounded {t.bar}" aria-hidden="true"></div>
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <p class="m-0 text-xs font-bold uppercase tracking-[0.8px] {t.label}">{label}</p>
      <p class="m-0 text-2xl font-extrabold leading-none {valueColor}">{value}</p>
      {#if caption}
        <p class="m-0 text-xs font-medium text-ink-muted">{caption}</p>
      {/if}
      <slot />
    </div>
  </div>
{/if}
