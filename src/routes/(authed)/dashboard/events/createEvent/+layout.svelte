<script>
  // @ts-nocheck
  /**
   * Create-event wizard chrome (roadmap 4.1 / FR-8a).
   * Daylight tokens; stepper lives here so currentStep stays accurate.
   * Mobile Exit + Step N of M: HI-FI 4:724.
   */
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import WizardStepper from "$lib/components/organizer/WizardStepper.svelte";
  import { loadEventDraft, EVENT_DRAFT_KEY } from "$lib/client/eventDraft";
  import {
    draftVisibility,
    draftIsPrivate,
    wizardSteps,
  } from "$lib/client/wizardSteps";

  const CREATE_STEPS = [
    { id: 1, label: "Details", shortLabel: "Details" },
    { id: 2, label: "Ticket Types", shortLabel: "Types" },
    { id: 3, label: "Ticket Design", shortLabel: "Design" },
    { id: 4, label: "Publish", shortLabel: "Publish" },
    { id: 5, label: "Status", shortLabel: "Status" },
  ];

  onMount(() => {
    if (currentStep === 5) {
      try {
        const snapshot = JSON.parse(sessionStorage.getItem("eventCreateStatus") || "null");
        draftVisibility.set(draftIsPrivate(snapshot) ? "private" : "public");
        return;
      } catch {
        /* fall through to the draft */
      }
    }
    draftVisibility.set(
      draftIsPrivate(loadEventDraft({}, EVENT_DRAFT_KEY)) ? "private" : "public",
    );
  });

  $: path = $page.url.pathname;
  $: currentStep = (() => {
    const m = path.match(/\/createEvent\/step(\d)/);
    return m ? parseInt(m[1], 10) : 1;
  })();
  $: steps = wizardSteps(CREATE_STEPS, $draftVisibility === "private");
  $: position = Math.max(1, steps.findIndex((s) => s.id === currentStep) + 1);
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
        Step {position} of {steps.length}
      </p>
    {/if}
  </header>

  {#if currentStep >= 1 && currentStep <= 5}
    <WizardStepper {currentStep} {steps} />
  {/if}

  <slot />
</div>
