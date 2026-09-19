<script>
  // @ts-nocheck
  /** FR-8a Step 2: Ticket types (HI-FI 506:238 desktop / 506:107 mobile free). */
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import WizardNav from "$lib/components/organizer/WizardNav.svelte";
  import { loadEventDraft, saveEventDraft } from "$lib/client/eventDraft";
  import Plus from "lucide-svelte/icons/plus";

  function emptyTicket(isFree) {
    return {
      name: "",
      description: "",
      price: isFree ? 0 : 10,
      quantity: null,
      benefits: [],
    };
  }

  let eventData = {
    is_free_event: true,
    total_capacity: null,
    ticket_types: [emptyTicket(true)],
  };

  let errors = {};

  onMount(() => {
    const loaded = loadEventDraft(eventData);
    eventData = {
      ...loaded,
      is_free_event:
        loaded.is_free_event !== undefined ? !!loaded.is_free_event : true,
    };
    if (!Array.isArray(eventData.ticket_types) || eventData.ticket_types.length === 0) {
      eventData.ticket_types = [emptyTicket(eventData.is_free_event)];
    }
  });

  function tierTitle(ticket, index) {
    const name = ticket.name?.trim();
    if (!name) return `TIER ${index + 1} (NEW)`;
    return `TIER ${index + 1} (${name.toUpperCase()})`;
  }

  function isEmptyTicket(ticket) {
    return !ticket.name?.trim();
  }

  function toggleFree() {
    eventData.is_free_event = !eventData.is_free_event;
    if (eventData.is_free_event) {
      eventData.ticket_types = eventData.ticket_types.map((t) => ({
        ...t,
        price: 0,
      }));
    }
  }

  function addTicketType() {
    eventData.ticket_types = [
      ...eventData.ticket_types,
      emptyTicket(eventData.is_free_event),
    ];
  }

  function removeTicketType(index) {
    if (eventData.ticket_types.length > 1) {
      eventData.ticket_types = eventData.ticket_types.filter((_, i) => i !== index);
    }
  }

  function persistableTickets() {
    return eventData.ticket_types.filter((t) => t.name?.trim());
  }

  function validateTickets(tickets) {
    errors = {};
    if (tickets.length === 0) {
      errors.general = "Add at least one ticket type with a name";
      return false;
    }
    tickets.forEach((ticket, index) => {
      if (!eventData.is_free_event && (ticket.price === null || ticket.price <= 0)) {
        errors[`ticket${index}Price`] = "Price must be greater than 0";
      }
      if (ticket.quantity === null || ticket.quantity === "" || Number(ticket.quantity) <= 0) {
        errors[`ticket${index}Quantity`] = "Valid quantity is required";
      }
    });
    return Object.keys(errors).length === 0;
  }

  function buildDraft(tickets) {
    const total = tickets.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
    return {
      ...eventData,
      ticket_types: tickets.map((t) => ({
        ...t,
        price: eventData.is_free_event ? 0 : t.price || 0,
      })),
      total_capacity: total,
    };
  }

  function nextStep() {
    const tickets = persistableTickets();
    if (tickets.length === 0) {
      errors = { general: "Add at least one ticket type with a name" };
      return;
    }
    // Drop blank NEW cards so capacity and validation match named tiers
    eventData.ticket_types = tickets;
    if (!validateTickets(tickets)) return;
    eventData = buildDraft(tickets);
    saveEventDraft(eventData);
    goto("/dashboard/events/createEvent/step3");
  }

  function prevStep() {
    saveEventDraft(eventData);
    goto("/dashboard/events/createEvent/step1");
  }
</script>

<div class="flex flex-col gap-4 lg:gap-6" in:fade={{ duration: 200 }}>
  <div class="flex flex-col gap-1.5">
    <h2
      class="m-0 font-display text-[20px] font-bold text-ink lg:hidden"
    >
      2. Ticket Types
    </h2>
    <h2 class="m-0 hidden text-lg font-extrabold text-ink lg:block">
      Event Ticket Types
    </h2>
    <p class="m-0 hidden text-[13px] text-ink-secondary lg:block">
      Create different ticket options for your attendees (e.g. VIP, Early Bird, General
      Admission).
    </p>
  </div>

  <div
    class="flex items-center justify-between gap-4 rounded-xl border border-paper-border bg-white px-4 py-3"
  >
    <div class="min-w-0 flex-1">
      <p class="m-0 text-[13px] font-bold text-ink lg:text-[15px]">Free event</p>
      <p class="m-0 mt-0.5 text-[11px] text-ink-secondary lg:mt-1 lg:text-[13px]">
        All tickets will be free and quantities will be hidden.
      </p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={eventData.is_free_event}
      aria-label="Free event"
      class="relative h-6 w-11 shrink-0 rounded-xl p-0.5 transition-colors border-0 cursor-pointer
        {eventData.is_free_event ? 'bg-brand' : 'bg-paper-border'}"
      on:click={toggleFree}
    >
      <span
        class="block size-5 rounded-[10px] bg-white shadow transition-transform
          {eventData.is_free_event ? 'translate-x-5' : 'translate-x-0'}"
        aria-hidden="true"
      ></span>
    </button>
  </div>

  {#if errors.general}
    <p class="text-sm text-red-600">{errors.general}</p>
  {/if}

  <div class="flex flex-wrap gap-4">
    {#each eventData.ticket_types as ticket, ticketIndex}
      {@const empty = isEmptyTicket(ticket)}
      <div
        class="flex w-full flex-col gap-3 rounded-xl border border-paper-border bg-white p-4 lg:w-[calc(50%-0.5rem)]
          {empty ? 'opacity-60' : ''}"
      >
        <div class="flex items-center justify-between gap-2">
          <p
            class="m-0 text-[11px] font-extrabold tracking-[1px]
              {empty ? 'text-ink-muted' : 'text-brand'}"
          >
            {tierTitle(ticket, ticketIndex)}
          </p>
          {#if eventData.ticket_types.length > 1 && !empty}
            <button
              type="button"
              class="rounded border-0 bg-[#fee2e2] px-2.5 py-1 text-[11px] font-bold text-[#ef4444] cursor-pointer"
              on:click={() => removeTicketType(ticketIndex)}
            >
              Remove
            </button>
          {/if}
        </div>

        <div class="flex flex-col gap-1.5">
          <label
            for="ticket-name-{ticketIndex}"
            class="text-[13px] font-bold text-ink"
          >
            Ticket Name
          </label>
          <input
            id="ticket-name-{ticketIndex}"
            type="text"
            bind:value={ticket.name}
            placeholder="e.g. VIP Backstage Pass"
            class="h-11 w-full rounded-lg border border-paper-border bg-white px-4 text-base text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label
            for="ticket-desc-{ticketIndex}"
            class="text-[13px] font-bold text-ink"
          >
            Description
          </label>
          <input
            id="ticket-desc-{ticketIndex}"
            type="text"
            bind:value={ticket.description}
            placeholder="e.g. Brief description"
            class="h-11 w-full rounded-lg border border-paper-border bg-white px-4 text-base text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {#if !eventData.is_free_event}
          <div class="flex gap-3">
            <div class="flex min-w-0 flex-1 flex-col gap-1.5">
              <label
                for="ticket-price-{ticketIndex}"
                class="text-[13px] font-bold text-ink"
              >
                Price (NLe)
              </label>
              <input
                id="ticket-price-{ticketIndex}"
                type="number"
                min="0.01"
                step="0.01"
                bind:value={ticket.price}
                placeholder="e.g. 500"
                class="h-11 w-full rounded-lg border bg-white px-4 text-base text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20
                  {errors[`ticket${ticketIndex}Price`] ? 'border-red-500' : 'border-paper-border'}"
              />
              {#if errors[`ticket${ticketIndex}Price`]}
                <p class="text-sm text-red-600">{errors[`ticket${ticketIndex}Price`]}</p>
              {/if}
            </div>
            <div class="flex min-w-0 flex-1 flex-col gap-1.5">
              <label
                for="ticket-qty-{ticketIndex}"
                class="text-[13px] font-bold text-ink"
              >
                Quantity Available
              </label>
              <input
                id="ticket-qty-{ticketIndex}"
                type="number"
                min="1"
                bind:value={ticket.quantity}
                placeholder="e.g. 20"
                class="h-11 w-full rounded-lg border bg-white px-4 text-base text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20
                  {errors[`ticket${ticketIndex}Quantity`] ? 'border-red-500' : 'border-paper-border'}"
              />
              {#if errors[`ticket${ticketIndex}Quantity`]}
                <p class="text-sm text-red-600">{errors[`ticket${ticketIndex}Quantity`]}</p>
              {/if}
            </div>
          </div>
        {:else}
          <div class="flex flex-col gap-1.5">
            <label
              for="ticket-qty-{ticketIndex}"
              class="text-[13px] font-bold text-ink"
            >
              Quantity Available
            </label>
            <input
              id="ticket-qty-{ticketIndex}"
              type="number"
              min="1"
              bind:value={ticket.quantity}
              placeholder="e.g. 20"
              class="h-11 w-full rounded-lg border bg-white px-4 text-base text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20
                {errors[`ticket${ticketIndex}Quantity`] ? 'border-red-500' : 'border-paper-border'}"
            />
            {#if errors[`ticket${ticketIndex}Quantity`]}
              <p class="text-sm text-red-600">{errors[`ticket${ticketIndex}Quantity`]}</p>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Mobile: text + Plus -->
  <div class="lg:hidden">
    <button
      type="button"
      on:click={addTicketType}
      class="inline-flex items-center gap-2 border-0 bg-transparent p-0 py-2 text-[15px] font-bold text-brand cursor-pointer"
    >
      <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
      Add Another Ticket Type
    </button>
  </div>

  <!-- Desktop: filled pill -->
  <div class="hidden lg:block">
    <button
      type="button"
      on:click={addTicketType}
      class="inline-flex items-center gap-1.5 rounded-lg border-0 bg-brand px-[18px] py-2.5 text-[13px] font-bold text-white cursor-pointer hover:opacity-90"
    >
      <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
      Add Ticket Type
    </button>
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
      Next: Ticket Design
    </button>
  </div>

  <!-- Desktop WizardNav -->
  <div class="hidden lg:block">
    <WizardNav
      backLabel="← Back"
      nextLabel="Next Step: Ticket Design →"
      onBack={prevStep}
      onNext={nextStep}
    />
  </div>
</div>
