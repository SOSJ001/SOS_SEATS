<script>
  // @ts-nocheck
  /** HI-FI Step 3 layout controls (55:1282 desktop / 36:88 mobile). */
  import { ACCENT_COLOURS } from "$lib/client/ticketLayout";

  export let layout = {};
  /** Display value for branding when layout.brandingLabel is empty */
  export let brandingPlaceholder = "";
  export let onChange = (_next) => {};

  function patch(partial) {
    onChange({ ...layout, ...partial });
  }

  function optionClass(selected) {
    return selected
      ? "bg-brand text-white border-brand"
      : "bg-white text-ink border-paper-border";
  }

  function radioDot(selected) {
    return selected
      ? "border-2 border-white bg-white"
      : "border-[1.5px] border-[#d0cbc4] bg-white";
  }

  function segmentClass(selected) {
    return selected
      ? "bg-brand text-white"
      : "bg-transparent text-ink-secondary";
  }

  function segmentDot(selected) {
    return selected
      ? "border-2 border-white bg-white"
      : "border-[1.5px] border-[#d0cbc4] bg-white";
  }
</script>

<div
  class="flex w-full flex-col gap-6 lg:rounded-xl lg:border lg:border-paper-border lg:bg-white lg:p-5"
>
  <div class="flex flex-col gap-3">
    <p class="m-0 text-[13px] font-bold text-ink">Accent Theme Colour</p>
    <div class="flex items-center gap-3">
      {#each ACCENT_COLOURS as colour}
        <button
          type="button"
          aria-label="Accent colour {colour}"
          aria-pressed={layout.accentColour === colour}
          class="flex size-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 cursor-pointer
            {layout.accentColour === colour ? 'ring-2 ring-[#12041c] ring-offset-1' : ''}"
          on:click={() => patch({ accentColour: colour })}
        >
          <span
            class="block size-5 rounded-full"
            style="background-color: {colour}"
            aria-hidden="true"
          ></span>
        </button>
      {/each}
    </div>
  </div>

  <div class="flex flex-col gap-2">
    <p class="m-0 text-[13px] font-bold text-ink">QR position</p>
    <div
      class="flex w-full items-center gap-1 rounded-lg border border-paper-border bg-white p-1"
      role="radiogroup"
      aria-label="QR position"
    >
      {#each [
        { id: "left", label: "Left" },
        { id: "centre", label: "Centre" },
        { id: "right", label: "Right" },
      ] as opt}
        <button
          type="button"
          role="radio"
          aria-checked={layout.qrPlacement === opt.id}
          class="inline-flex flex-1 items-center gap-2 rounded-md px-3 py-2.5 text-[13px] font-bold cursor-pointer border-0
            {segmentClass(layout.qrPlacement === opt.id)}"
          on:click={() => patch({ qrPlacement: opt.id })}
        >
          <span
            class="size-4 shrink-0 rounded-full
              {segmentDot(layout.qrPlacement === opt.id)}"
            aria-hidden="true"
          ></span>
          {opt.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="flex flex-col gap-3">
    <p class="m-0 text-[13px] font-bold text-ink">Font</p>
    <div class="flex flex-nowrap items-center gap-2 overflow-x-auto pb-0.5 lg:gap-3">
      {#each [
        { id: "plusJakarta", label: "Plus Jakarta Sans" },
        { id: "inter", label: "Inter" },
        { id: "roboto", label: "Roboto" },
      ] as opt}
        <button
          type="button"
          class="inline-flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-2.5 text-[12px] font-bold cursor-pointer whitespace-nowrap lg:gap-2.5 lg:px-3 lg:text-[13px]
            {optionClass(layout.fontFamily === opt.id)}"
          on:click={() => patch({ fontFamily: opt.id })}
        >
          <span
            class="size-4 shrink-0 rounded-full border-[1.5px]
              {radioDot(layout.fontFamily === opt.id)}"
            aria-hidden="true"
          ></span>
          {opt.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="flex flex-col gap-3">
    <p class="m-0 text-[13px] font-bold text-ink">Background Pattern</p>
    <div class="flex flex-nowrap items-center gap-2 overflow-x-auto pb-0.5 lg:gap-3">
      {#each [
        { id: "none", label: "None" },
        { id: "subtleGrid", label: "Subtle Grid" },
        { id: "diagonal", label: "Diagonal" },
      ] as opt}
        <button
          type="button"
          class="inline-flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-2.5 text-[12px] font-bold cursor-pointer whitespace-nowrap lg:gap-2.5 lg:px-3 lg:text-[13px]
            {optionClass(layout.backgroundPattern === opt.id)}"
          on:click={() => patch({ backgroundPattern: opt.id })}
        >
          <span
            class="size-4 shrink-0 rounded-full border-[1.5px]
              {radioDot(layout.backgroundPattern === opt.id)}"
            aria-hidden="true"
          ></span>
          {opt.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="flex flex-col gap-1.5">
    <label for="branding-label" class="text-[13px] font-bold text-ink">
      Branding label
    </label>
    <input
      id="branding-label"
      type="text"
      value={layout.brandingLabel}
      placeholder={brandingPlaceholder || "Event name"}
      class="h-11 w-full rounded-lg border border-paper-border bg-white px-4 text-base text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      on:input={(e) => patch({ brandingLabel: e.currentTarget.value })}
    />
  </div>

  <div
    class="flex flex-col gap-2 rounded-xl border border-paper-border bg-white px-5 py-4"
  >
    <div
      class="flex items-center justify-between gap-3 rounded-lg border border-paper-border bg-white px-4 py-2.5"
    >
      <span class="text-[13px] font-bold text-ink">Include date and time</span>
      <button
        type="button"
        role="switch"
        aria-checked={layout.includeDateTime}
        aria-label="Include date and time"
        class="relative h-6 w-11 shrink-0 rounded-xl border-0 p-0.5 transition-colors cursor-pointer
          {layout.includeDateTime ? 'bg-brand' : 'bg-paper-border'}"
        on:click={() => patch({ includeDateTime: !layout.includeDateTime })}
      >
        <span
          class="block size-5 rounded-[10px] bg-white shadow transition-transform
            {layout.includeDateTime ? 'translate-x-5' : 'translate-x-0'}"
          aria-hidden="true"
        ></span>
      </button>
    </div>

    <div
      class="flex items-center justify-between gap-3 rounded-lg border border-paper-border bg-white px-4 py-2.5"
    >
      <span class="text-[13px] font-bold text-ink">Include venue</span>
      <button
        type="button"
        role="switch"
        aria-checked={layout.includeVenue}
        aria-label="Include venue"
        class="relative h-6 w-11 shrink-0 rounded-xl border-0 p-0.5 transition-colors cursor-pointer
          {layout.includeVenue ? 'bg-brand' : 'bg-paper-border'}"
        on:click={() => patch({ includeVenue: !layout.includeVenue })}
      >
        <span
          class="block size-5 rounded-[10px] bg-white shadow transition-transform
            {layout.includeVenue ? 'translate-x-5' : 'translate-x-0'}"
          aria-hidden="true"
        ></span>
      </button>
    </div>

    <div
      class="flex items-center justify-between gap-3 rounded-lg border border-paper-border bg-white px-4 py-2.5"
    >
      <span class="text-[13px] font-bold text-ink">Show support/disclaimer text</span>
      <button
        type="button"
        role="switch"
        aria-checked={layout.showDisclaimer}
        aria-label="Show support/disclaimer text"
        class="relative h-6 w-11 shrink-0 rounded-xl border-0 p-0.5 transition-colors cursor-pointer
          {layout.showDisclaimer ? 'bg-brand' : 'bg-paper-border'}"
        on:click={() => patch({ showDisclaimer: !layout.showDisclaimer })}
      >
        <span
          class="block size-5 rounded-[10px] bg-white shadow transition-transform
            {layout.showDisclaimer ? 'translate-x-5' : 'translate-x-0'}"
          aria-hidden="true"
        ></span>
      </button>
    </div>
  </div>
</div>
