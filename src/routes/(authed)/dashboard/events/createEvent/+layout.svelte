<script>
  // @ts-nocheck
  /**
   * Create-event wizard chrome (roadmap 4.1 / FR-8a).
   * Daylight tokens; stepper lives here so currentStep stays accurate.
   * Mobile Exit + Step N of 5: HI-FI 4:724.
   */
  import { page } from "$app/stores";
  import WizardStepper from "$lib/components/organizer/WizardStepper.svelte";

  $: path = $page.url.pathname;
  $: currentStep = (() => {
    const m = path.match(/\/createEvent\/step(\d)/);
    return m ? parseInt(m[1], 10) : 1;
  })();
</script>

<div class="w-full">
  <header
    class="mb-3 flex items-center justify-between px-0 py-3 lg:hidden"
  >
    {#if currentStep === 5}
      <a
        href="/dashboard/events"
        class="text-sm font-bold text-ink-secondary no-underline"
      >
        Done
      </a>
      <p class="m-0 text-base font-extrabold text-brand">Success</p>
    {:else}
      <a
        href="/dashboard/events"
        class="text-sm font-bold text-ink-secondary no-underline"
      >
        ← Exit
      </a>
      <p class="m-0 text-base font-extrabold text-brand">
        Step {currentStep} of 5
      </p>
    {/if}
  </header>

  {#if currentStep >= 1 && currentStep <= 5}
    <WizardStepper {currentStep} />
  {/if}

  <slot />
</div>
