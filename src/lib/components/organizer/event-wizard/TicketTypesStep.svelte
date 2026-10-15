<script>
  // @ts-nocheck
  /** Event wizard step 2: Ticket types (HI-FI 506:238 desktop / 506:107 mobile free). */
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import WizardNav from "$lib/components/organizer/WizardNav.svelte";
  import { loadEventDraft, saveEventDraft } from "$lib/client/eventDraft";
  import { draftIsPrivate } from "$lib/client/wizardSteps";
  import { EVENT_LIMITS } from "$lib/eventLimits";
  import Plus from "lucide-svelte/icons/plus";
  import Lock from "lucide-svelte/icons/lock";

  /** @type {"create" | "edit"} */
  export let mode = "create";
  export let basePath;
  export let draftKey;
  export let event = null;

  const inputClass =
    "h-11 w-full rounded-lg border bg-white px-4 text-base text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

  function emptyTicket(isFree) {
    return {
      name: "",
      description: "",
      price: isFree ? 0 : 10,
      quantity: null,
    };
  }

  let eventData = {
    is_free_event: true,
    total_capacity: null,
    ticket_types: [emptyTicket(true)],
  };

  let errors = {};

  $: isEdit = mode === "edit";
  $: freeLocked = isEdit && !!event?.hasTicketSales;

  onMount(() => {
    const loaded = loadEventDraft(eventData, draftKey);
    if (draftIsPrivate(loaded)) {
      goto(`${basePath}/step3`, { replaceState: true });
      return;
    }
    eventData = {
      ...loaded,
      is_free_event:
        loaded.is_free_event !== undefined ? !!loaded.is_free_event : true,
    };
    if (!Array.isArray(eventData.ticket_types) || eventData.ticket_types.length === 0) {
      eventData.ticket_types = [emptyTicket(eventData.is_free_event)];
    }
  });

  function soldOf(ticket) {
    return Number(ticket?.sold_quantity) || 0;
  }

  function tierTitle(ticket, index) {
    const name = ticket.name?.trim();
    if (!name) return `TIER ${index + 1} (NEW)`;
    return `TIER ${index + 1} (${name.toUpperCase()})`;
  }

  function isEmptyTicket(ticket) {
    return !ticket.name?.trim();
  }

  function toggleFree() {
    if (freeLocked) return;
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
    if (soldOf(eventData.ticket_types[index]) > 0) return;
    if (eventData.ticket_types.length > 1) {
      eventData.ticket_types = eventData.ticket_types.filter((_, i) => i !== index);
    }
  }

  function persistableTickets() {
    return eventData.ticket_types.filter((t) => t.name?.trim() || soldOf(t) > 0);
  }

  function validateTickets(tickets) {
    errors = {};
    if (tickets.length === 0) {
      errors.general = "Add at least one ticket type with a name";
      return false;
    }
    const seen = new Set();
    tickets.forEach((ticket, index) => {
      const name = ticket.name?.trim() || "";
      if (!name) {
        errors[`ticket${index}Name`] = "Ticket name is required";
      } else if (seen.has(name.toLowerCase())) {
        errors[`ticket${index}Name`] = "Each ticket type needs a different name";
      }
      seen.add(name.toLowerCase());
      const price = Number(ticket.price);
      if (
        !eventData.is_free_event &&
        (ticket.price === null || ticket.price === "" || !(price > 0))
      ) {
        errors[`ticket${index}Price`] = "Price must be greater than 0";
      } else if (!eventData.is_free_event && price > EVENT_LIMITS.ticketPriceMax) {
        errors[`ticket${index}Price`] = "Price is too high";
      }
      const qty = Number(ticket.quantity);
      if (
        ticket.quantity === null ||
        ticket.quantity === "" ||
        !Number.isInteger(qty) ||
        qty <= 0 ||
        qty > EVENT_LIMITS.ticketQuantityMax
      ) {
        errors[`ticket${index}Quantity`] = "Valid quantity is required";
      } else if (qty < soldOf(ticket)) {
        errors[`ticket${index}Quantity`] = `Can't be below the ${soldOf(ticket)} already sold`;
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
      _dirty: isEdit ? true : eventData._dirty,
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
    saveEventDraft(eventData, draftKey);
    goto(`${basePath}/step3`);
  }

  function prevStep() {
    saveEventDraft(
      { ...eventData, _dirty: isEdit ? true : eventData._dirty },
      draftKey,
    );
    goto(`${basePath}/step1`);
  }
</script>

<div class="flex flex-col gap-4 lg:gap-6" in:fade={{ duration: 200 }}>
  <div class="flex flex-col gap-1.5">
    <h2 class="m-0 font-display text-[20px] font-bold text-ink lg:hidden">
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
      <p class="m-0 flex items-center gap-1.5 text-[13px] font-bold text-ink lg:text-[15px]">
        Free event
        {#if freeLocked}
          <Lock size={14} strokeWidth={2} class="text-ink-secondary" aria-hidden="true" />
        {/if}
      </p>
      <p class="m-0 mt-0.5 text-[11px] text-ink-secondary lg:mt-1 lg:text-[13px]">
        {freeLocked
          ? "Tickets have been sold, so this can't change."
          : "All tickets will be free and quantities will be hidden."}
      </p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={eventData.is_free_event}
      aria-label="Free event"
      disabled={freeLocked}
      class="relative h-6 w-11 shrink-0 rounded-xl border-0 p-0.5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
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
      {@const sold = soldOf(ticket)}
      <div
        class="flex w-full flex-col gap-3 rounded-xl border border-paper-border bg-white p-4 lg:w-[calc(50%-0.5rem)]
          {empty && sold === 0 ? 'opacity-60' : ''}"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <p
              class="m-0 truncate text-[11px] font-extrabold tracking-[1px]
                {empty ? 'text-ink-muted' : 'text-brand'}"
            >
              {tierTitle(ticket, ticketIndex)}
            </p>
            {#if sold > 0}
              <span
                class="shrink-0 rounded-full bg-brand-wash px-2 py-0.5 text-[11px] font-bold text-brand"
              >
                {sold} sold
              </span>
            {/if}
          </div>
          {#if eventData.ticket_types.length > 1 && !empty}
            <button
              type="button"
              disabled={sold > 0}
              title={sold > 0 ? "Tickets of this type have been sold" : undefined}
              class="rounded border-0 bg-[#fee2e2] px-2.5 py-1 text-[11px] font-bold text-[#ef4444] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              on:click={() => removeTicketType(ticketIndex)}
            >
              Remove
            </button>
          {/if}
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="ticket-name-{ticketIndex}" class="text-[13px] font-bold text-ink">
            Ticket Name
          </label>
          <input
            id="ticket-name-{ticketIndex}"
            type="text"
            maxlength={EVENT_LIMITS.ticketName}
            bind:value={ticket.name}
            placeholder="e.g. VIP Backstage Pass"
            class="{inputClass} {errors[`ticket${ticketIndex}Name`] ? 'border-red-500' : 'border-paper-border'}"
          />
          {#if errors[`ticket${ticketIndex}Name`]}
            <p class="text-sm text-red-600">{errors[`ticket${ticketIndex}Name`]}</p>
          {/if}
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="ticket-desc-{ticketIndex}" class="text-[13px] font-bold text-ink">
            Description
          </label>
          <input
            id="ticket-desc-{ticketIndex}"
            type="text"
            maxlength={EVENT_LIMITS.ticketDescription}
            bind:value={ticket.description}
            placeholder="e.g. Brief description"
            class="{inputClass} border-paper-border"
          />
        </div>

        <div class="flex gap-3">
          {#if !eventData.is_free_event}
            <div class="flex min-w-0 flex-1 flex-col gap-1.5">
              <label for="ticket-price-{ticketIndex}" class="text-[13px] font-bold text-ink">
                Price (NLe)
              </label>
              <input
                id="ticket-price-{ticketIndex}"
                type="number"
                min="0.01"
                max={EVENT_LIMITS.ticketPriceMax}
                step="0.01"
                bind:value={ticket.price}
                placeholder="e.g. 500"
                class="{inputClass} {errors[`ticket${ticketIndex}Price`] ? 'border-red-500' : 'border-paper-border'}"
              />
              {#if errors[`ticket${ticketIndex}Price`]}
                <p class="text-sm text-red-600">{errors[`ticket${ticketIndex}Price`]}</p>
              {/if}
            </div>
          {/if}
          <div class="flex min-w-0 flex-1 flex-col gap-1.5">
            <label for="ticket-qty-{ticketIndex}" class="text-[13px] font-bold text-ink">
              Quantity Available
            </label>
            <input
              id="ticket-qty-{ticketIndex}"
              type="number"
              min={Math.max(1, sold)}
              max={EVENT_LIMITS.ticketQuantityMax}
              bind:value={ticket.quantity}
              placeholder="e.g. 20"
              class="{inputClass} {errors[`ticket${ticketIndex}Quantity`] ? 'border-red-500' : 'border-paper-border'}"
            />
            {#if errors[`ticket${ticketIndex}Quantity`]}
              <p class="text-sm text-red-600">{errors[`ticket${ticketIndex}Quantity`]}</p>
            {/if}
          </div>
        </div>
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
