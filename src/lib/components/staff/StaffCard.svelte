<script>
  // @ts-nocheck
  /**
   * One door staff member (HI-FI 115:88). Contact only, never a name.
   * Dispatches `edit` and `revoke` with the staff member.
   */
  import { createEventDispatcher } from "svelte";
  import StaffIdentity from "./StaffIdentity.svelte";

  /** @type {{ id: string, type: "email" | "phone", contact: string, createdAt: string, events: { id: string, name: string }[] }} */
  export let staff;
  export let highlight = false;

  const dispatch = createEventDispatcher();
</script>

<article
  class="flex w-full flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0px_4px_6px_rgba(0,0,0,0.04)] {highlight
    ? 'border-[1.5px] border-green-600'
    : 'border border-paper-border'}"
>
  <StaffIdentity {staff} />

  {#if staff.events.length > 0}
    <ul class="m-0 flex w-full list-none flex-wrap items-center gap-2 p-0">
      {#each staff.events as event (event.id)}
        <li class="rounded-full bg-brand/10 px-2 py-1 text-[11px] font-extrabold text-brand">
          {event.name}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="m-0 text-xs text-ink-muted">No events assigned</p>
  {/if}

  <div class="flex w-full items-center justify-end gap-2">
    <button
      type="button"
      class="cursor-pointer rounded-md border-0 bg-brand/[0.08] px-2 py-1 text-[11px] font-extrabold text-brand hover:bg-brand/15"
      on:click={() => dispatch("edit", staff)}
    >
      Edit
    </button>
    <button
      type="button"
      class="cursor-pointer rounded-md border border-paper-border bg-white px-2 py-1 text-[11px] font-extrabold text-ink-secondary hover:bg-paper-cream"
      on:click={() => dispatch("revoke", staff)}
    >
      Revoke
    </button>
  </div>
</article>
