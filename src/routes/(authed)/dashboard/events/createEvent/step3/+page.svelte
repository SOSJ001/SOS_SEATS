<script>
  // @ts-nocheck
  /** FR-8a Step 3: Ticket design (HI-FI 55:1282 / mobile 36:88). */
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import WizardNav from "$lib/components/organizer/WizardNav.svelte";
  import TicketLayoutPanel from "$lib/components/organizer/TicketLayoutPanel.svelte";
  import TicketLivePreview from "$lib/components/organizer/TicketLivePreview.svelte";
  import { loadEventDraft, saveEventDraft } from "$lib/client/eventDraft";
  import {
    defaultTicketLayout,
    ensureTicketDesignWithLayout,
    applyLayoutToDesignConfig,
  } from "$lib/client/ticketLayout";

  let eventData = {};
  let layout = { ...defaultTicketLayout };

  onMount(() => {
    eventData = loadEventDraft({});
    const design = ensureTicketDesignWithLayout(eventData.ticket_design_config);
    eventData.ticket_design_config = design;
    layout = { ...design.layout };
    saveEventDraft(eventData);
  });

  function handleLayoutChange(next) {
    layout = next;
    eventData.ticket_design_config = applyLayoutToDesignConfig(
      eventData.ticket_design_config,
      layout,
    );
    saveEventDraft(eventData);
  }

  function persist() {
    eventData.ticket_design_config = applyLayoutToDesignConfig(
      eventData.ticket_design_config,
      layout,
    );
    saveEventDraft(eventData);
  }

  function nextStep() {
    persist();
    goto("/dashboard/events/createEvent/step4");
  }

  function prevStep() {
    persist();
    goto("/dashboard/events/createEvent/step2");
  }
</script>

<div class="flex flex-col gap-4 lg:gap-6" in:fade={{ duration: 200 }}>
  <h2 class="m-0 font-display text-[20px] font-bold text-ink lg:hidden">
    3. Customize Ticket Design
  </h2>

  <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
    <!-- Controls: second on mobile, first on desktop -->
    <div class="order-2 flex min-w-0 flex-1 flex-col gap-6 lg:order-1">
      <h2 class="m-0 hidden text-lg font-extrabold text-ink lg:block">
        Layout Configurations
      </h2>
      <TicketLayoutPanel
        {layout}
        brandingPlaceholder={eventData.name || ""}
        onChange={handleLayoutChange}
      />
    </div>

    <!-- Preview: first on mobile, second on desktop -->
    <div
      class="order-1 flex w-full flex-col gap-3 lg:order-2 lg:w-[420px] lg:shrink-0 lg:items-center lg:gap-4"
    >
      <p class="m-0 text-[13px] font-bold text-ink lg:hidden">Ticket preview</p>
      <p class="m-0 hidden text-[15px] font-bold text-ink-secondary lg:block">
        LIVE PREVIEW
      </p>
      <TicketLivePreview
        {layout}
        eventName={eventData.name || ""}
        eventDate={eventData.date || ""}
        eventTime={eventData.time || ""}
        eventLocation={eventData.location || ""}
        ticketTypes={eventData.ticket_types || []}
      />
    </div>
  </div>

  <!-- Mobile: Back outline + Next solid -->
  <div class="grid grid-cols-2 gap-3 pt-1 lg:hidden">
    <button
      type="button"
      class="flex h-12 items-center justify-center rounded-lg border-[1.5px] border-brand bg-white text-[15px] font-bold text-brand cursor-pointer"
      on:click={prevStep}
    >
      Back
    </button>
    <button
      type="button"
      class="flex h-12 items-center justify-center rounded-lg border-0 bg-brand text-[15px] font-bold text-white cursor-pointer hover:opacity-90"
      on:click={nextStep}
    >
      Next: Publish
    </button>
  </div>

  <!-- Desktop WizardNav -->
  <div class="hidden lg:block">
    <WizardNav
      backLabel="← Back"
      nextLabel="Next Step: Review & Publish →"
      onBack={prevStep}
      onNext={nextStep}
    />
  </div>
</div>
