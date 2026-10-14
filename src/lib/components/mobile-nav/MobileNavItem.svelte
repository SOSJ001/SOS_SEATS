<script>
  // @ts-nocheck
  import PublicIcon from "$lib/components/public/PublicIcon.svelte";

  export let href = "";
  /** PublicIcon name. */
  export let icon = "";
  export let label = "";
  export let sub = "";
  export let active = false;
</script>

<a
  {href}
  class="flex h-14 w-full items-center gap-3 rounded-2xl border border-solid p-4 {active
    ? 'border-brand bg-[#fff5f1] shadow-[0_4px_6px_rgba(255,90,31,0.1)]'
    : 'border-paper-border bg-paper'}"
  aria-current={active ? "page" : undefined}
  on:click
>
  <span
    class="flex size-8 shrink-0 items-center justify-center rounded-lg {active
      ? 'bg-brand/10 text-brand'
      : 'bg-[#f5f3f0] text-ink'}"
  >
    <PublicIcon name={icon} size={18} />
  </span>
  <span class="min-w-0 flex-1 text-left">
    <span
      class="block text-[15px] {sub ? 'font-bold' : 'font-semibold'} {active
        ? 'text-brand'
        : 'text-ink'}">{label}</span
    >
    {#if sub}
      <span class="block truncate text-xs text-ink-secondary">{sub}</span>
    {/if}
  </span>
  <PublicIcon name="chevron-right" size={20} color="#9a92b3" />
</a>
