<script>
  // @ts-nocheck
  /** Edit-event wizard chrome: same design as createEvent, 4 steps, no status step. */
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import WizardStepper from "$lib/components/organizer/WizardStepper.svelte";
  import { syncEditDraft } from "$lib/client/eventDraft";
  import { showToast } from "$lib/store";

  export let data;

  const EDIT_STEPS = [
    { id: 1, label: "Details", shortLabel: "Details" },
    { id: 2, label: "Ticket Types", shortLabel: "Types" },
    { id: 3, label: "Ticket Design", shortLabel: "Design" },
    { id: 4, label: "Review", shortLabel: "Review" },
  ];

  let syncedFor = "";

  // Runs before child steps mount, so they read the fresh draft.
  $: if (browser && data.event) {
    const marker = `${data.event.id}:${data.event.updated_at}`;
    if (marker !== syncedFor) {
      syncedFor = marker;
      if (syncEditDraft(data.event)) {
        showToast(
          "warning",
          "Event changed",
          "This event changed since you started editing. Your unsaved edits were reset.",
        );
      }
    }
  }

  $: hubHref = `/dashboard/events/eventDetails?id=${data.event.id}`;
  $: currentStep = (() => {
    const m = $page.url.pathname.match(/\/step(\d)/);
    return m ? parseInt(m[1], 10) : 1;
  })();
</script>

<div class="w-full">
  <header class="mb-3 flex items-center justify-between px-0 py-3 lg:hidden">
    <a href={hubHref} class="text-sm font-bold text-ink-secondary no-underline">
      ← Exit
    </a>
    <p class="m-0 text-base font-extrabold text-brand">
      Step {currentStep} of {EDIT_STEPS.length}
    </p>
  </header>

  <WizardStepper {currentStep} steps={EDIT_STEPS} ariaLabel="Edit event steps" />

  {#key data.event.updated_at}
    <slot />
  {/key}
</div>
