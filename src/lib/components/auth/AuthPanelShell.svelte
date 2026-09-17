<script>
  // @ts-nocheck
  /**
   * Desktop AuthPanel chrome: centered card, panel fixed, card body scrolls.
   * Density: min panel inset --auth-panel-inset; card uses --auth-* tokens.
   */
  import AuthPanelDecor from "$lib/components/auth/AuthPanelDecor.svelte";

  /** Match Figma AuthCard border (sign-up); sign-in omits it. */
  export let bordered = false;
</script>

<div
  class="relative flex-1 min-h-screen bg-white lg:h-full lg:min-h-0 lg:overflow-hidden"
>
  <div class="pointer-events-none absolute inset-0 z-0 hidden lg:block">
    <AuthPanelDecor />
  </div>

  <div
    class="relative z-[1] flex min-h-full w-full items-center justify-center px-6 py-8 lg:h-full lg:overflow-hidden lg:px-[var(--auth-panel-inset)] lg:py-[var(--auth-panel-inset)]"
  >
    <div
      class="flex w-full max-w-[var(--auth-card-max)] flex-col overflow-hidden bg-white lg:max-h-full lg:min-h-0 lg:max-w-[min(var(--auth-card-max),31.25vw)] lg:rounded-[var(--auth-card-radius)] lg:shadow-[0px_2px_4px_rgba(0,0,0,0.03),0px_12px_14px_rgba(0,0,0,0.06)] {bordered
        ? 'lg:border lg:border-paper-border'
        : ''}"
    >
      <div
        class="flex min-h-0 w-full flex-col gap-[var(--auth-card-gap)] px-5 py-6 lg:overflow-y-auto lg:overscroll-contain lg:px-[var(--auth-card-pad-x)] lg:py-[var(--auth-card-pad-y)]"
      >
        <slot />
      </div>
    </div>
  </div>
</div>
