<script>
  // @ts-nocheck
  /** Account choice row - HI-FI 1397:5083 / 1397:5132 (Create account, Sign in). */
  import ChevronRight from "lucide-svelte/icons/chevron-right";

  export let href = "";
  /** lucide-svelte icon component */
  export let icon = null;
  export let title = "";
  export let audience = "";
  export let guidance = "";
  export let highlighted = false;
</script>

<a
  {href}
  class="flex w-full items-center gap-3 rounded-2xl p-4 no-underline shadow-[0px_4px_12px_-4px_rgba(18,4,28,0.03)] transition-colors lg:gap-2.5 lg:rounded-xl lg:px-3 lg:py-2.5 {highlighted
    ? 'border-[1.5px] border-brand bg-[#fff5f0] hover:bg-[#ffede4]'
    : 'border border-paper-border bg-white hover:border-brand/40'}"
>
  <span
    class="flex size-10 shrink-0 items-center justify-center rounded-full text-brand lg:size-8 {highlighted
      ? 'bg-white'
      : 'bg-paper-cream'}"
  >
    <svelte:component this={icon} size={22} class="size-[22px] lg:size-[18px]" />
  </span>
  <span class="flex min-w-0 flex-1 flex-col gap-1 lg:gap-0.5">
    <span class="text-lg font-extrabold leading-6 text-ink lg:text-sm lg:leading-tight">{title}</span>
    <span
      class="text-[13px] font-bold leading-[18px] text-ink-secondary lg:text-[12px] lg:leading-snug"
      >{audience}</span
    >
    <span
      class="text-[13px] font-normal leading-[18px] text-ink-secondary lg:text-[12px] lg:leading-snug"
      >{guidance}</span
    >
  </span>
  <ChevronRight size={16} class="shrink-0 text-brand" />
</a>
