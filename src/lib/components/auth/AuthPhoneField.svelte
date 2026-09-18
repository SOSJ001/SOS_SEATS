<script>
  // @ts-nocheck
  import Phone from "lucide-svelte/icons/phone";

  export let id;
  export let label = "Sierra Leone Phone Number";
  export let value = "";
  export let placeholder = "77 483 920";
  export let required = true;
  export let showLeadingIcon = false;
  /** `"default"` | `"mobile"` — mobile matches Figma phone auth (52px / +232 chip). */
  export let variant = "default";

  $: isMobile = variant === "mobile";

  function onInput(e) {
    // Keep digits and spaces for display; server normalizes.
    value = e.currentTarget.value;
  }
</script>

<div class="flex w-full flex-col {isMobile ? 'gap-2' : 'gap-[var(--auth-field-gap)]'}">
  <label
    for={id}
    class={isMobile
      ? "text-[11px] font-bold uppercase text-ink-secondary"
      : "text-sm font-semibold text-ink"}>{label}</label
  >
  <div
    class="flex items-center border border-paper-border bg-white {isMobile
      ? 'h-[52px] gap-3 rounded-xl px-4'
      : 'h-[var(--auth-input-h)] gap-2 rounded-[var(--auth-input-radius)] px-3.5'}"
  >
    {#if showLeadingIcon && !isMobile}
      <Phone
        class="shrink-0 text-ink-muted"
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
      />
    {/if}

    <div
      class="flex shrink-0 items-center gap-1.5 rounded-lg border border-paper-border bg-[#f8fafc] px-2 py-1"
      aria-hidden="true"
    >
      <!-- Sierra Leone flag: green / white / blue horizontal -->
      <span
        class="inline-block h-3 w-[18px] overflow-hidden rounded-sm"
        style="background: linear-gradient(to bottom, #1EB53A 0%, #1EB53A 33.33%, #fff 33.33%, #fff 66.66%, #0072C6 66.66%, #0072C6 100%)"
      ></span>
      <span class="text-sm font-extrabold text-ink">+232</span>
    </div>

    <div class="h-4 w-px shrink-0 bg-paper-border" aria-hidden="true"></div>

    <input
      {id}
      {required}
      {placeholder}
      type="tel"
      inputmode="numeric"
      autocomplete="tel-national"
      {value}
      on:input={onInput}
      class="min-w-0 flex-1 border-0 bg-transparent p-0 focus:outline-none focus:ring-0 {isMobile
        ? 'text-[15px] text-ink placeholder:text-ink-secondary'
        : 'text-sm text-ink placeholder:text-[#999]'}"
      aria-describedby="{id}-prefix"
    />
    <span id="{id}-prefix" class="sr-only">Country code +232</span>
  </div>
</div>
