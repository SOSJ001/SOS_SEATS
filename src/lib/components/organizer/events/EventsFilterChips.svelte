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

<div class="flex flex-wrap items-center gap-2" role="group" aria-label={ariaLabel}>
  {#each options as option (option.id)}
    {@const isActive = option.id === active}
    <button
      type="button"
      class="cursor-pointer rounded-full border px-3 py-1.5 text-[13px] leading-normal transition-colors lg:px-4 lg:py-2 {isActive
        ? 'border-brand bg-brand font-bold text-white'
        : 'border-paper-border bg-paper font-medium text-ink-secondary hover:border-brand/40 hover:text-ink lg:text-ink'}"
      aria-pressed={isActive}
      on:click={() => dispatch("change", option.id)}
    >
      {option.label}
    </button>
  {/each}
</div>
