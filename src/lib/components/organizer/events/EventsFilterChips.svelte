<script>
  // @ts-nocheck
  /**
   * Events list status chips (HI-FI 55:965 / 4:651).
   */
  import { createEventDispatcher } from "svelte";

  /** @type {{ id: string, label: string }[]} */
  export let options = [];
  export let active = "";
  export let ariaLabel = "Filter events by status";

  const dispatch = createEventDispatcher();
</script>

<div
  class="-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 py-0.5 [scrollbar-width:none] md:-mx-6 md:px-6 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
  role="group"
  aria-label={ariaLabel}
>
  {#each options as option (option.id)}
    {@const isActive = option.id === active}
    <button
      type="button"
      class="shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] leading-normal transition-colors lg:px-4 lg:py-2 {isActive
        ? 'border-brand bg-brand font-bold text-white'
        : 'border-paper-border bg-paper font-medium text-ink-secondary hover:border-brand/40 hover:text-ink lg:text-ink'}"
      aria-pressed={isActive}
      on:click={() => dispatch("change", option.id)}
    >
      {option.label}
    </button>
  {/each}
</div>
