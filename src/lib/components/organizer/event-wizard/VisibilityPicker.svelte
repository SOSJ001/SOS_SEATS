<script>
  // @ts-nocheck
  /** Public / Private choice for the event wizard. Private events skip Ticket Types. */
  import { createEventDispatcher } from "svelte";

  /** @type {"public" | "private"} */
  export let value = "public";
  /** Non-empty when the option can't be picked (edit mode rules). */
  export let publicLockedReason = "";
  export let privateLockedReason = "";

  const dispatch = createEventDispatcher();

  $: options = [
    {
      value: "public",
      label: "Public",
      hint: "Show in browse. Sell tickets from the ticket types you set up next.",
      locked: publicLockedReason,
    },
    {
      value: "private",
      label: "Private",
      hint: "Invite only. No ticket types: generate invites (fee per ticket) after creating, then share them from the Guests tab.",
      locked: privateLockedReason,
    },
  ];

  function select(opt) {
    if (opt.locked || opt.value === value) return;
    dispatch("change", opt.value);
  }

  function rowClass(selected, locked) {
    if (locked) return "border border-paper-border bg-paper-cream cursor-not-allowed opacity-60";
    return selected
      ? "border-2 border-brand bg-white cursor-pointer"
      : "border border-paper-border bg-white cursor-pointer";
  }

  function radioDot(selected) {
    return selected ? "border-brand bg-brand" : "border-[#bfb8c7] bg-white";
  }
</script>

<div class="flex flex-col gap-1.5 lg:gap-3">
  <p class="m-0 text-[13px] font-bold text-ink lg:text-sm lg:text-ink-secondary">
    Visibility
  </p>
  <div class="flex flex-col gap-2 lg:gap-3" role="radiogroup" aria-label="Event visibility">
    {#each options as opt (opt.value)}
      <button
        type="button"
        role="radio"
        aria-checked={value === opt.value}
        aria-disabled={opt.locked ? "true" : undefined}
        class="flex w-full items-center gap-2.5 rounded-lg p-3 text-left {rowClass(
          value === opt.value,
          !!opt.locked && value !== opt.value,
        )}"
        on:click={() => select(opt)}
      >
        <span
          class="size-4 shrink-0 rounded-full border-[1.5px] {radioDot(value === opt.value)}"
          aria-hidden="true"
        ></span>
        <span class="flex min-w-0 flex-col gap-0.5">
          <span class="text-[14px] font-bold text-ink lg:text-[13px] lg:font-semibold">
            {opt.label}
          </span>
          <span class="text-[12px] text-ink-secondary lg:text-[11px]">
            {opt.locked && value !== opt.value ? opt.locked : opt.hint}
          </span>
        </span>
      </button>
    {/each}
  </div>
</div>
