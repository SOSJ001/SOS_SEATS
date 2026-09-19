<script>
  // @ts-nocheck
  /** FR-8a Step 4: Review & publish (HI-FI 55:1378 / mobile 36:157). */
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import Check from "lucide-svelte/icons/check";
  import {
    loadEventDraft,
    saveEventDraft,
    clearEventDraft,
  } from "$lib/client/eventDraft";
  import { showToast, defaultTicketDesignConfig } from "$lib/store";

  let eventData = {
    audience_type: "all-ages",
    event_visibility: "public",
  };
  let confirmed = true;
  let isPublishing = false;
  let isSavingDraft = false;

  const STATUS_SNAPSHOT_KEY = "eventCreateStatus";

  const audiences = [
    { value: "all-ages", label: "All ages" },
    { value: "18-plus", label: "18+" },
    { value: "21-plus", label: "21+" },
  ];

  const visibilities = [
    { value: "public", label: "Public", hint: "Show in browse" },
    { value: "private", label: "Private", hint: "Hidden from browse." },
  ];

  const summaryFields = [
    { label: "EVENT NAME", key: "name" },
    { label: "DATE & TIME", key: "dateTime" },
    { label: "VENUE", key: "venue" },
    { label: "TICKET TYPES", key: "tickets" },
    { label: "AUDIENCE", key: "audience" },
    { label: "VISIBILITY", key: "visibility" },
  ];

  onMount(() => {
    eventData = {
      audience_type: "all-ages",
      event_visibility: "public",
      ...loadEventDraft({}),
    };
    if (!eventData.audience_type) eventData.audience_type = "all-ages";
    if (!eventData.event_visibility) eventData.event_visibility = "public";
    if (!eventData.ticket_design_config) {
      eventData.ticket_design_config = defaultTicketDesignConfig;
    }
    saveEventDraft(eventData);
  });

  function persist() {
    saveEventDraft(eventData);
  }

  function visibilityLabel(v) {
    return v === "private" ? "Private" : "Public";
  }

  function audienceLabel(v) {
    if (v === "18-plus") return "18+";
    if (v === "21-plus") return "21+";
    return "All ages";
  }

  function formatDateTime(dateStr, timeStr) {
    if (!dateStr) return "—";
    const iso = timeStr
      ? `${dateStr}T${timeStr.length === 5 ? `${timeStr}:00` : timeStr}`
      : `${dateStr}T00:00:00`;
    const base = new Date(iso);
    if (Number.isNaN(base.getTime())) {
      return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
    }
    const datePart = base.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (!timeStr) return datePart;
    const timePart = base.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} · ${timePart}`;
  }

  function ticketTypesSummaryFrom(data) {
    const types = Array.isArray(data.ticket_types)
      ? data.ticket_types.filter((t) => t?.name?.trim())
      : [];
    const n = types.length;
    const total =
      data.total_capacity ??
      types.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
    const typeWord = n === 1 ? "ticket type" : "ticket types";
    const ticketWord = total === 1 ? "ticket" : "tickets";
    return `${n} ${typeWord} · ${total || 0} ${ticketWord}`;
  }

  // Template `{fn()}` does not track `eventData`; keep labels as $: deps.
  $: dateTimeDisplay = formatDateTime(eventData.date, eventData.time);
  $: ticketTypesDisplay = ticketTypesSummaryFrom(eventData);
  $: audienceDisplay = audienceLabel(eventData.audience_type);
  $: visibilityDisplay = visibilityLabel(eventData.event_visibility);

  $: summaryValues = {
    name: eventData.name || "—",
    dateTime: dateTimeDisplay,
    venue: eventData.location || "—",
    tickets: ticketTypesDisplay,
    audience: audienceDisplay,
    visibility: visibilityDisplay,
  };

  function selectAudience(value) {
    eventData.audience_type = value;
    persist();
  }

  function selectVisibility(value) {
    eventData.event_visibility = value;
    persist();
  }

  async function submit(status) {
    if (status === "published" && !confirmed) return;
    if (status === "published") isPublishing = true;
    else isSavingDraft = true;

    try {
      persist();
      const imageBase64 =
        typeof eventData.imagePreview === "string"
          ? eventData.imagePreview
          : null;

      const eventDataForDB = {
        ...eventData,
        image: imageBase64,
        ticket_design_config:
          eventData.ticket_design_config || defaultTicketDesignConfig,
        status,
        tags: eventData.tags || [],
        website: eventData.website || "",
        social_media: eventData.social_media || {},
      };

      const response = await fetch("/createEventApi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventDataForDB),
      });

      const result = await response.json();
      if (result.success) {
        const namedTypes = Array.isArray(eventData.ticket_types)
          ? eventData.ticket_types.filter((t) => t?.name?.trim())
          : [];
        const totalCapacity =
          eventData.total_capacity ??
          namedTypes.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
        sessionStorage.setItem(
          STATUS_SNAPSHOT_KEY,
          JSON.stringify({
            event_id: result.event_id,
            status,
            event_visibility: eventData.event_visibility || "public",
            name: eventData.name || "",
            date: eventData.date || "",
            time: eventData.time || "",
            location: eventData.location || "",
            total_capacity: totalCapacity,
            ticket_type_count: namedTypes.length,
          }),
        );
        clearEventDraft();
        goto("/dashboard/events/createEvent/step5");
      } else {
        showToast(
          "error",
          status === "published" ? "Publishing failed" : "Save failed",
          result.error,
        );
      }
    } catch {
      showToast(
        "error",
        status === "published" ? "Publishing failed" : "Save failed",
        "Please try again.",
      );
    } finally {
      isPublishing = false;
      isSavingDraft = false;
    }
  }

  function prevStep() {
    persist();
    goto("/dashboard/events/createEvent/step3");
  }

  function audienceRowClass(selected) {
    return selected
      ? "border-transparent bg-[#fff1eb]"
      : "border-paper-border bg-white";
  }

  function visibilityRowClass(selected) {
    return selected
      ? "border-2 border-brand bg-white"
      : "border border-paper-border bg-white";
  }

  function radioDot(selected) {
    return selected
      ? "border-brand bg-brand"
      : "border-[#bfb8c7] bg-white";
  }
</script>

<div class="flex flex-col gap-4 lg:gap-6" in:fade={{ duration: 200 }}>
  <h2 class="m-0 font-display text-[20px] font-bold text-ink lg:hidden">
    4. Review Summary
  </h2>
  <div class="hidden flex-col gap-1.5 lg:flex">
    <h2 class="m-0 text-[28px] font-extrabold leading-tight text-ink">Review</h2>
    <p class="m-0 text-sm text-ink-secondary">
      Check the details, then publish or save a draft.
    </p>
  </div>

  <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <!-- Mobile stacked summary -->
      <div
        class="flex flex-col gap-4 rounded-xl border border-paper-border bg-white p-4 lg:hidden"
      >
        {#each summaryFields as field, i}
          {#if i > 0}
            <div class="h-px w-full bg-paper-border"></div>
          {/if}
          <div class="flex flex-col gap-1">
            <p
              class="m-0 text-[11px] font-extrabold uppercase tracking-wide text-ink-secondary"
            >
              {field.label}
            </p>
            <p class="m-0 text-base font-extrabold text-ink">
              {summaryValues[field.key]}
            </p>
          </div>
        {/each}
      </div>

      <!-- Desktop summary -->
      <div
        class="hidden flex-col gap-[18px] rounded-xl border border-paper-border bg-white p-6 lg:flex"
      >
        <h3 class="m-0 text-base font-extrabold text-ink">Event Summary</h3>
        <div class="h-px w-full bg-paper-border"></div>
        <dl class="m-0 flex flex-col gap-4 text-[13px]">
          <div class="flex items-start justify-between gap-4">
            <dt class="m-0 shrink-0 text-ink-secondary">Event Title</dt>
            <dd class="m-0 text-right font-bold text-ink">
              {eventData.name || "—"}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="m-0 shrink-0 text-ink-secondary">Date &amp; Time</dt>
            <dd class="m-0 text-right font-bold text-ink">{dateTimeDisplay}</dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="m-0 shrink-0 text-ink-secondary">Venue Address</dt>
            <dd class="m-0 text-right font-bold text-ink">
              {eventData.location || "—"}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="m-0 shrink-0 text-ink-secondary">Ticket types</dt>
            <dd class="m-0 text-right font-bold text-ink">
              {ticketTypesDisplay}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="m-0 shrink-0 text-ink-secondary">Audience</dt>
            <dd class="m-0 text-right font-bold text-ink">
              {audienceDisplay}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="m-0 shrink-0 text-ink-secondary">Visibility</dt>
            <dd class="m-0 text-right font-bold text-ink">
              {visibilityDisplay}
            </dd>
          </div>
        </dl>
      </div>

      {#if eventData.imagePreview}
        <div
          class="relative h-[200px] w-full overflow-hidden rounded-xl lg:h-[240px]"
        >
          <img
            src={eventData.imagePreview}
            alt=""
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
          />
          <img
            src={eventData.imagePreview}
            alt="Event cover"
            class="relative z-10 h-full w-full object-contain"
          />
        </div>
      {:else}
        <div
          class="flex h-[200px] w-full items-center justify-center rounded-xl border border-dashed border-paper-border bg-paper-cream text-sm text-ink-muted lg:h-[240px]"
        >
          No cover image
        </div>
      {/if}
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <div class="flex flex-col gap-1.5 lg:gap-3">
        <p class="m-0 text-[13px] font-bold text-ink lg:text-sm lg:text-ink-secondary">
          Audience
        </p>
        <div class="flex flex-col gap-2 lg:gap-3">
          {#each audiences as opt}
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left cursor-pointer lg:gap-3 lg:p-3
                {audienceRowClass(eventData.audience_type === opt.value)}"
              on:click={() => selectAudience(opt.value)}
            >
              <span
                class="size-4 shrink-0 rounded-full border-[1.5px]
                  {radioDot(eventData.audience_type === opt.value)}"
                aria-hidden="true"
              ></span>
              <span class="text-[14px] font-bold text-ink lg:text-[13px] lg:font-semibold"
                >{opt.label}</span
              >
            </button>
          {/each}
        </div>
      </div>

      <div class="flex flex-col gap-1.5 lg:gap-3">
        <p class="m-0 text-[13px] font-bold text-ink lg:text-sm lg:text-ink-secondary">
          Visibility
        </p>
        <div class="flex flex-col gap-2 lg:gap-3">
          {#each visibilities as opt}
            <button
              type="button"
              class="flex w-full items-center gap-2.5 rounded-lg p-3 text-left cursor-pointer
                {visibilityRowClass(eventData.event_visibility === opt.value)}"
              on:click={() => selectVisibility(opt.value)}
            >
              <span
                class="size-4 shrink-0 rounded-full border-[1.5px]
                  {radioDot(eventData.event_visibility === opt.value)}"
                aria-hidden="true"
              ></span>
              <span class="flex min-w-0 flex-col gap-0.5">
                <span
                  class="text-[14px] font-bold text-ink lg:text-[13px] lg:font-semibold"
                  >{opt.label}</span
                >
                <span class="text-[12px] text-ink-secondary lg:text-[11px]"
                  >{opt.hint}</span
                >
              </span>
            </button>
          {/each}
        </div>
      </div>

      <button
        type="button"
        class="flex w-full items-center gap-2.5 rounded-lg border border-paper-border bg-white p-3 text-left cursor-pointer"
        on:click={() => (confirmed = !confirmed)}
      >
        <span
          class="flex size-5 shrink-0 items-center justify-center rounded-[10px] border-2
            {confirmed
            ? 'border-brand bg-[#fff1eb] text-brand'
            : 'border-paper-border bg-white text-transparent'}"
          aria-hidden="true"
        >
          {#if confirmed}
            <Check size={12} strokeWidth={3} />
          {/if}
        </span>
        <span class="text-[13px] font-semibold text-ink">
          I confirm these details are correct.
        </span>
      </button>

      <!-- Desktop publish -->
      <button
        type="button"
        disabled={!confirmed || isPublishing || isSavingDraft}
        class="hidden w-full rounded-lg bg-brand px-6 py-4 text-base font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 lg:block"
        on:click={() => submit("published")}
      >
        {isPublishing ? "Publishing…" : "Publish Event"}
      </button>
    </div>
  </div>

  <!-- Mobile: Save Draft | Back | Publish -->
  <div class="grid grid-cols-3 gap-3 pt-1 lg:hidden">
    <button
      type="button"
      disabled={isPublishing || isSavingDraft}
      class="flex h-12 items-center justify-center rounded-lg border-[1.5px] border-brand bg-white text-[15px] font-bold text-brand cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      on:click={() => submit("draft")}
    >
      {isSavingDraft ? "Saving…" : "Save Draft"}
    </button>
    <button
      type="button"
      class="flex h-12 items-center justify-center rounded-lg border-[1.5px] border-brand bg-white text-[15px] font-bold text-brand cursor-pointer"
      on:click={prevStep}
    >
      Back
    </button>
    <button
      type="button"
      disabled={!confirmed || isPublishing || isSavingDraft}
      class="flex h-12 items-center justify-center rounded-lg border-0 bg-brand text-[15px] font-bold text-white cursor-pointer hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      on:click={() => submit("published")}
    >
      {isPublishing ? "Publishing…" : "Publish"}
    </button>
  </div>

  <!-- Desktop footer -->
  <div
    class="hidden items-stretch justify-between gap-3 border-t border-paper-border pt-6 sm:flex-row sm:items-center lg:flex"
  >
    <button
      type="button"
      class="rounded-lg border border-paper-border bg-white px-6 py-3 text-sm font-bold text-ink-secondary transition hover:bg-paper-cream cursor-pointer"
      on:click={prevStep}
    >
      ← Back
    </button>
    <button
      type="button"
      disabled={isPublishing || isSavingDraft}
      class="rounded-lg border border-paper-border bg-white px-6 py-3 text-sm font-bold text-ink-secondary transition hover:bg-paper-cream disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      on:click={() => submit("draft")}
    >
      {isSavingDraft ? "Saving…" : "Save Draft"}
    </button>
  </div>
</div>
