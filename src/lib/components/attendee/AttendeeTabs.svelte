<script>
  // @ts-nocheck
  /**
   * Attendee sub-tabs: mobile segmented control (610:1374 / 624:1394) below lg,
   * desktop loose pills (604:1542 / 604:1612, dense per hifi-density) at lg.
   */
  /** @type {{ id: string; label: string }[]} */
  export let tabs = [];
  /** @type {string} */
  export let active = "";
  /** @type {(id: string) => void} */
  export let onChange = () => {};
  export let ariaLabel = "Tabs";
</script>

<div class="flex w-full items-start lg:hidden" role="tablist" aria-label={ariaLabel}>
  <div class="flex flex-1 gap-1 rounded-full border border-paper-border bg-paper p-1">
    {#each tabs as tab (tab.id)}
      <button
        type="button"
        role="tab"
        aria-selected={active === tab.id}
        class="flex h-9 flex-1 cursor-pointer items-center justify-center rounded-full border-0 text-[13px] font-bold {active ===
        tab.id
          ? 'bg-brand text-white'
          : 'bg-transparent text-ink-secondary'}"
        on:click={() => onChange(tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </div>
</div>

<div class="hidden items-center gap-2.5 lg:flex" role="tablist" aria-label={ariaLabel}>
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      role="tab"
      aria-selected={active === tab.id}
      class="cursor-pointer rounded-[20px] px-3.5 py-1.5 text-[13px] {active === tab.id
        ? 'border-0 bg-brand font-bold text-white'
        : 'border border-solid border-paper-border bg-transparent font-medium text-ink-secondary'}"
      on:click={() => onChange(tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</div>
