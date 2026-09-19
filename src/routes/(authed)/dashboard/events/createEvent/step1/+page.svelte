<script>
  // @ts-nocheck
  /** FR-8a Step 1: Event Information (desktop 55:1131 / mobile 4:724). */
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import WizardField from "$lib/components/organizer/WizardField.svelte";
  import WizardNav from "$lib/components/organizer/WizardNav.svelte";
  import { loadEventDraft, saveEventDraft } from "$lib/client/eventDraft";
  import Image from "lucide-svelte/icons/image";

  export let data;

  const MAX_COVER_BYTES = 5 * 1024 * 1024;

  let eventData = {
    name: "",
    category: "",
    date: "",
    time: "",
    location: "",
    description: "",
    imagePreview: null,
    organizer: "",
  };

  let errors = {};
  let imagePreview = null;
  let imageError = "";

  onMount(() => {
    const userName = $page.data?.userName || data?.userName || "";
    eventData = loadEventDraft({
      ...eventData,
      organizer: userName || "Organizer",
    });
    if (eventData.imagePreview) {
      imagePreview = eventData.imagePreview;
    }
    if (!eventData.organizer && userName) {
      eventData.organizer = userName;
    }
  });

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    imageError = "";
    if (!file) return;
    if (file.size > MAX_COVER_BYTES) {
      imageError = "Image must be 5MB or smaller";
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview = e.target.result;
      eventData.imagePreview = imagePreview;
    };
    reader.readAsDataURL(file);
  }

  function withCategoryDefaults(data) {
    return {
      ...data,
      category: data.category?.trim() ? data.category : "Other",
    };
  }

  function validateStep() {
    errors = {};
    if (!eventData.name?.trim()) errors.name = "Event name is required";
    if (!eventData.date) errors.date = "Event date is required";
    if (!eventData.time) errors.time = "Event time is required";
    if (!eventData.location?.trim()) errors.location = "Venue location is required";
    return Object.keys(errors).length === 0;
  }

  function saveDraft() {
    const userName = $page.data?.userName || data?.userName || "";
    saveEventDraft(
      withCategoryDefaults({
        ...eventData,
        imagePreview,
        organizer: eventData.organizer || userName || "Organizer",
      }),
    );
  }

  function nextStep() {
    if (!validateStep()) return;
    const userName = $page.data?.userName || data?.userName || "";
    saveEventDraft(
      withCategoryDefaults({
        ...eventData,
        imagePreview,
        organizer: eventData.organizer || userName || "Organizer",
      }),
    );
    goto("/dashboard/events/createEvent/step2");
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
          placeholder="e.g. Freetown Music Festival"
          error={errors.name || ""}
        />

        <WizardField
          id="organizer"
          label="Organiser"
          bind:value={eventData.organizer}
          placeholder="e.g. Freetown Events"
        />

        <WizardField
          id="description"
          label="Description"
          type="textarea"
          rows={4}
          bind:value={eventData.description}
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
          placeholder="e.g. Bintumani Complex, Freetown"
          error={errors.location || ""}
        />

        <!-- Mobile cover: under Venue (HI-FI 4:724) -->
        <div class="flex flex-col gap-1.5 lg:hidden">
          <p class="m-0 text-[13px] font-bold text-ink">Cover Media Upload</p>
          <label
            class="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-[1.5px] border-dashed border-paper-border bg-white transition hover:bg-brand-wash
              {imagePreview ? 'p-0' : 'p-5'}"
          >
            {#if imagePreview}
              <div class="relative h-[160px] w-full overflow-hidden">
                <img
                  src={imagePreview}
                  alt=""
                  aria-hidden="true"
                  class="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
                />
                <img
                  src={imagePreview}
                  alt="Cover preview"
                  class="relative z-10 h-full w-full object-contain"
                />
              </div>
              <span
                class="w-full bg-white py-2 text-center text-[13px] font-semibold text-brand"
                >Replace image</span
              >
            {:else}
              <Image
                class="text-brand"
                size={24}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span class="text-center text-[13px] font-semibold text-brand">
                Click to upload event flyer
              </span>
              <span class="text-center text-[11px] text-ink-secondary">
                Recommended ratio: 16:9 (Max 5MB)
              </span>
            {/if}
            <input
              type="file"
              accept="image/*"
              class="sr-only"
              on:change={handleImageUpload}
            />
          </label>
          {#if imageError}
            <p class="text-sm text-red-600">{imageError}</p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Desktop cover: side panel -->
    <div class="hidden w-full flex-col gap-4 lg:flex lg:w-[420px] lg:shrink-0">
      <h2 class="m-0 text-lg font-extrabold text-ink">Cover Media Upload</h2>

      <label
        class="flex min-h-[280px] flex-1 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-[1.5px] border-dashed border-brand bg-white transition hover:bg-brand-wash lg:min-h-[464px]
          {imagePreview ? 'p-0' : 'p-8'}"
      >
        {#if imagePreview}
          <div class="relative min-h-[280px] w-full flex-1 overflow-hidden lg:min-h-[400px]">
            <img
              src={imagePreview}
              alt=""
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
            />
            <img
              src={imagePreview}
              alt="Cover preview"
              class="relative z-10 h-full w-full object-contain"
            />
          </div>
          <span
            class="w-full bg-white py-3 text-center text-[15px] font-bold text-brand"
            >Replace image</span
          >
        {:else}
          <Image
            class="text-brand"
            size={36}
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span class="text-center text-[15px] font-bold text-brand">
            Click to upload event flyer
          </span>
          <span class="text-center text-xs text-ink-secondary">
            Recommended aspect ratio: 16:9 (Max size 5MB)
          </span>
        {/if}
        <input
          type="file"
          accept="image/*"
          class="sr-only"
          on:change={handleImageUpload}
        />
      </label>
      {#if imageError}
        <p class="text-sm text-red-600">{imageError}</p>
      {/if}
    </div>
  </div>

  <!-- Mobile: full-width Next only -->
  <div class="pt-1 lg:hidden">
    <button
      type="button"
      class="flex h-12 w-full items-center justify-center rounded-lg bg-brand text-[15px] font-bold text-white transition hover:opacity-90"
      on:click={nextStep}
    >
      Next: Ticket Types
    </button>
  </div>

  <!-- Desktop: Save Draft + Next -->
  <div class="hidden lg:block">
    <WizardNav
      backLabel="Save Draft"
      nextLabel="Next: Ticket Types →"
      onBack={saveDraft}
      onNext={nextStep}
    />
  </div>
</div>
