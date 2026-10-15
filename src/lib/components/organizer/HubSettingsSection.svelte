<script>
  // @ts-nocheck
  /** Card section for the event hub Settings tab. */
  export let title;
  export let description = "";
  /** lucide-svelte icon component */
  export let icon = null;
</script>

<section class="flex flex-col gap-4 rounded-2xl border border-paper-border bg-paper p-4 lg:p-6">
  <header class="flex items-start gap-3">
    {#if icon}
      <span
        class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-wash text-brand"
        aria-hidden="true"
      >
        <svelte:component this={icon} size={18} />
      </span>
    {/if}
    <div class="flex min-w-0 flex-col gap-0.5">
      <h3 class="m-0 text-[15px] font-extrabold text-ink lg:text-base">{title}</h3>
      {#if description}
        <p class="m-0 text-[12px] text-ink-secondary lg:text-[13px]">{description}</p>
      {/if}
    </div>
  </header>
  <slot />
</section>
