<script>
  // @ts-nocheck
  /** Event wizard step 1: Event Information (desktop 55:1131 / mobile 4:724). */
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import WizardField from "$lib/components/organizer/WizardField.svelte";
  import WizardNav from "$lib/components/organizer/WizardNav.svelte";
  import CoverUpload from "$lib/components/organizer/event-wizard/CoverUpload.svelte";
  import VisibilityPicker from "$lib/components/organizer/event-wizard/VisibilityPicker.svelte";
  import { loadEventDraft, saveEventDraft } from "$lib/client/eventDraft";
  import { draftVisibility, draftIsPrivate } from "$lib/client/wizardSteps";
  import { compressImage } from "$lib/client/compressImage";
  import { DEFAULT_CATEGORY } from "$lib/eventCategories";
  import { EVENT_LIMITS } from "$lib/eventLimits";

  /** @type {"create" | "edit"} */
  export let mode = "create";
  export let basePath;
  export let draftKey;
  export let event = null;
  export let userName = "";

  const MAX_COVER_BYTES = 5 * 1024 * 1024;
  const DRAFT_TOO_LARGE =
    "Cover too large to keep in your draft, re-add it before saving.";

  let eventData = {
    name: "",
    category: "",
    date: "",
    time: "",
    location: "",
    description: "",
    imagePreview: null,
    organizer: "",
    event_visibility: "public",
  };

  let errors = {};
  let imagePreview = null;
  let imageError = "";
  let compressing = false;

  $: isEdit = mode === "edit";
  $: exitHref = isEdit && event?.id
    ? `/dashboard/events/eventDetails?id=${event.id}`
    : "/dashboard/events";
  $: isPrivate = draftIsPrivate(eventData);
  $: privateLockedReason =
    isEdit && event?.hasTicketSales
      ? "Tickets have already been sold, so this event can't be made private."
      : "";
  $: publicLockedReason =
    isEdit && event?.hasPrivateTickets
      ? "This event has private invites, so it can't be made public."
      : "";
  $: nextShort = isPrivate ? "Next: Ticket Design" : "Next: Ticket Types";

  onMount(() => {
    eventData = loadEventDraft(
      isEdit ? eventData : { ...eventData, organizer: userName || "Organizer" },
      draftKey,
    );
    if (eventData.imagePreview) imagePreview = eventData.imagePreview;
    if (!isEdit && !eventData.organizer && userName) {
      eventData.organizer = userName;
    }
    eventData.event_visibility = draftIsPrivate(eventData) ? "private" : "public";
    draftVisibility.set(eventData.event_visibility);
  });

  function selectVisibility(e) {
    eventData.event_visibility = e.detail;
    if (isEdit) eventData._dirty = true;
    draftVisibility.set(e.detail);
    persist();
  }

  async function handleImageUpload(e) {
    const file = e.currentTarget.files?.[0];
    imageError = "";
    if (!file) return;
    if (file.size > MAX_COVER_BYTES) {
      imageError = "Image must be 5MB or smaller";
      e.currentTarget.value = "";
      return;
    }
    compressing = true;
    try {
      imagePreview = await compressImage(file);
      eventData.imagePreview = imagePreview;
      eventData._dirty = true;
    } catch {
      imageError = "Could not read this image. Try a JPEG, PNG or WebP.";
    } finally {
      compressing = false;
    }
  }

  function buildDraft() {
    const draft = {
      ...eventData,
      imagePreview,
      _dirty: isEdit ? true : eventData._dirty,
    };
    if (!isEdit) {
      draft.category = eventData.category?.trim()
        ? eventData.category
        : DEFAULT_CATEGORY;
      draft.organizer = eventData.organizer || userName || "Organizer";
    }
    return draft;
  }

  function persist() {
    const kept = saveEventDraft(buildDraft(), draftKey);
    if (!kept) {
      imagePreview = null;
      eventData.imagePreview = null;
      imageError = DRAFT_TOO_LARGE;
    }
    return kept;
  }

  function validateStep() {
    errors = {};
    if (!eventData.name?.trim()) errors.name = "Event name is required";
    if (!eventData.date) errors.date = "Event date is required";
    if (!eventData.time) errors.time = "Event time is required";
    if (!eventData.location?.trim()) errors.location = "Venue location is required";
    return Object.keys(errors).length === 0;
  }

  function onBack() {
    if (isEdit) {
      goto(exitHref);
      return;
    }
    persist();
  }

  function nextStep() {
    if (compressing || !validateStep()) return;
    if (!persist()) return;
    goto(`${basePath}/${isPrivate ? "step3" : "step2"}`);
  }
</script>

<div class="flex flex-col gap-4 lg:gap-6" in:fade={{ duration: 200 }}>
  <div class="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-8">
    <!-- Event Information fields -->
    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <h2
        class="m-0 font-display text-[20px] font-bold text-ink lg:font-sans lg:text-lg lg:font-extrabold"
      >
        1. Event Information
      </h2>

      <div class="flex flex-col gap-3 lg:gap-4">
        <WizardField
          id="name"
          label="Event Name"
          bind:value={eventData.name}
          maxlength={EVENT_LIMITS.name}
          placeholder="e.g. Freetown Music Festival"
          error={errors.name || ""}
        />

        <WizardField
          id="organizer"
          label="Organiser"
          bind:value={eventData.organizer}
          maxlength={EVENT_LIMITS.organizer}
          placeholder="e.g. Freetown Events"
        />

        <WizardField
          id="description"
          label="Description"
          type="textarea"
          rows={4}
          bind:value={eventData.description}
          maxlength={EVENT_LIMITS.description}
          placeholder="Provide basic schedules, artist lineups, or custom notices here..."
        />

        <div class="grid grid-cols-2 gap-3">
          <WizardField
            id="date"
            label="Date"
            type="date"
            bind:value={eventData.date}
            error={errors.date || ""}
          />
          <WizardField
            id="time"
            label="Time"
            type="time"
            bind:value={eventData.time}
            error={errors.time || ""}
          />
        </div>

        <WizardField
          id="location"
          label="Venue Location"
          bind:value={eventData.location}
          maxlength={EVENT_LIMITS.location}
          placeholder="e.g. Bintumani Complex, Freetown"
          error={errors.location || ""}
        />

        <VisibilityPicker
          value={eventData.event_visibility}
          {publicLockedReason}
          {privateLockedReason}
          on:change={selectVisibility}
        />

        <!-- Mobile cover: under Venue (HI-FI 4:724) -->
        <div class="flex flex-col gap-1.5 lg:hidden">
          <p class="m-0 text-[13px] font-bold text-ink">Cover Media Upload</p>
          <CoverUpload
            variant="compact"
            {imagePreview}
            {compressing}
            error={imageError}
            on:change={handleImageUpload}
          />
        </div>
      </div>
    </div>

    <!-- Desktop cover: side panel -->
    <div class="hidden w-full flex-col gap-4 lg:flex lg:w-[420px] lg:shrink-0">
      <h2 class="m-0 text-lg font-extrabold text-ink">Cover Media Upload</h2>
      <CoverUpload
        variant="panel"
        {imagePreview}
        {compressing}
        error={imageError}
        on:change={handleImageUpload}
      />
    </div>
  </div>

  <!-- Mobile: full-width Next only -->
  <div class="pt-1 lg:hidden">
    <button
      type="button"
      disabled={compressing}
      class="flex h-12 w-full items-center justify-center rounded-lg bg-brand text-[15px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      on:click={nextStep}
    >
      {nextShort}
    </button>
  </div>

  <!-- Desktop: Save Draft (create) or Cancel (edit) + Next -->
  <div class="hidden lg:block">
    <WizardNav
      backLabel={isEdit ? "Cancel" : "Save Draft"}
      nextLabel="{nextShort} →"
      nextDisabled={compressing}
      {onBack}
      onNext={nextStep}
    />
  </div>
</div>
