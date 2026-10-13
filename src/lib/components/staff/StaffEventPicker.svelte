<script>
  // @ts-nocheck
  /**
   * Event checkboxes for staff access (HI-FI 115:83 desktop, 36:768 mobile).
   * Empty state 1540:5172: no upcoming published events.
   */
  import { createEventDispatcher } from "svelte";
  import Check from "lucide-svelte/icons/check";
  import { formatEventDateTime } from "$lib/components/door/doorFormat.js";

  /** @type {{ id: string, name: string, date: string | null }[]} */
  export let events = [];
  /** @type {string[]} */
  export let selected = [];
  export let error = "";
  export let idPrefix = "staff-event";
  /** `"form"` (Invite card) | `"panel"` (Edit dialog 1540:5719: desktop look at every size) */
  export let variant = "form";

  const dispatch = createEventDispatcher();

  $: panel = variant === "panel";

  function toggle(id) {
    selected = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    dispatch("change", { selected });
  }
</script>

<div
  class="flex w-full flex-col border {panel
    ? 'gap-3 rounded-xl bg-paper-cream p-4'
    : 'gap-2.5 rounded-lg bg-white p-3 lg:gap-3 lg:rounded-xl lg:bg-paper-cream lg:p-4'} {error
    ? 'border-red-500'
    : 'border-paper-border'}"
>
  {#if events.length === 0}
    <p class="m-0 text-sm font-medium leading-normal text-ink lg:text-[13px] lg:text-ink-body">
      No upcoming published events. Publish an event to assign staff.
    </p>
    <a
      href="/dashboard/events/createEvent"
      class="text-sm font-medium text-brand underline lg:text-[13px]"
    >
      Create Event
    </a>
  {:else}
    {#each events as event (event.id)}
      {@const checked = selected.includes(event.id)}
      <label
        for="{idPrefix}-{event.id}"
        class="flex w-full cursor-pointer items-center {panel
          ? 'gap-2.5'
          : 'gap-3 py-1 lg:gap-2.5 lg:py-0'}"
      >
        <input
          id="{idPrefix}-{event.id}"
          type="checkbox"
          class="peer sr-only"
          {checked}
          on:change={() => toggle(event.id)}
        />
        <span
          class="flex shrink-0 items-center justify-center rounded peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 {panel
            ? 'size-[18px] border'
            : 'size-5 border-[1.5px] lg:size-[18px] lg:border'} {checked
            ? 'border-brand bg-brand text-white'
            : 'border-paper-border bg-white'}"
          aria-hidden="true"
        >
          {#if checked}
            <Check size={panel ? 10 : 12} strokeWidth={3} />
          {/if}
        </span>
        <span
          class="min-w-0 flex-1 truncate font-medium {panel
            ? 'text-[13px] text-ink-body'
            : 'text-sm text-ink lg:text-[13px] lg:text-ink-body'}"
        >
          {event.name}
        </span>
        <span
          class="shrink-0 font-medium {panel
            ? 'text-[13px] text-ink-body'
            : 'text-sm text-ink-muted lg:text-[13px] lg:text-ink-body'}"
        >
          {formatEventDateTime(event.date, null)}
        </span>
      </label>
    {/each}
  {/if}
</div>
{#if error}
  <p class="m-0 text-xs leading-normal text-red-500 lg:leading-[1.5]">{error}</p>
{/if}
