<script>
  // @ts-nocheck
  /** Warns before a private ticket that was already shared goes out again. */
  import { createEventDispatcher } from "svelte";
  import TriangleAlert from "lucide-svelte/icons/triangle-alert";
  import AppDialog from "$lib/components/authed/AppDialog.svelte";
  import { formatSharedAt, maskTicketNumber } from "$lib/client/ticketLayout";

  export let open = false;
  /** @type {any} */
  export let guest = null;
  export let hasNext = false;

  const dispatch = createEventDispatcher();

  $: viaLabel = guest?.sharedVia === "download" ? "Download" : "Share";
  $: primaryAction = hasNext ? "next" : "again";
  $: primaryLabel = hasNext ? "Share next unshared ticket" : "Share again anyway";

  const primaryClass =
    "flex h-11 cursor-pointer items-center justify-center rounded-lg border-0 bg-brand text-sm font-bold text-white hover:bg-brand/90 lg:h-10";
  const cancelClass =
    "flex h-11 cursor-pointer items-center justify-center rounded-lg border border-paper-border bg-white text-sm font-bold text-ink-secondary hover:bg-paper-cream lg:h-10";

  function close() {
    open = false;
    dispatch("cancel");
  }

  function pick(action) {
    open = false;
    dispatch(action);
  }
</script>

<AppDialog
  open={open && !!guest}
  variant="center"
  role="alertdialog"
  labelledby="reshare-warning-title"
  describedby="reshare-warning-desc"
  dense
  on:close={close}
>
  {#if guest}
    <div class="flex w-full flex-col items-center gap-2 text-center">
      <div
        class="flex size-12 items-center justify-center rounded-full bg-[#fef3c7] text-[#d97706]"
        aria-hidden="true"
      >
        <TriangleAlert size={22} strokeWidth={2} />
      </div>
      <div class="flex w-full flex-col items-center gap-2">
        <h2
          id="reshare-warning-title"
          class="m-0 font-display text-xl font-bold text-ink lg:font-public lg:font-extrabold"
        >
          Already shared
        </h2>
        <p id="reshare-warning-desc" class="m-0 text-sm leading-[1.4] text-ink-secondary lg:leading-5">
          Ticket {maskTicketNumber(guest.ticketNumber || guest.id)} was already shared
          on {formatSharedAt(guest.sharedAt)} (via {viaLabel}). Sharing it again may
          let two people use it.
        </p>
      </div>
    </div>

    <div class="flex w-full flex-col items-center gap-1">
      <div class="flex w-full flex-col gap-2.5 lg:hidden">
        <button type="button" class="{primaryClass} w-full" on:click={() => pick(primaryAction)}>
          {primaryLabel}
        </button>
        <button type="button" class="{cancelClass} w-full" on:click={close}>Cancel</button>
      </div>

      <div class="hidden w-full gap-3 lg:flex">
        <button type="button" class="{cancelClass} w-28 shrink-0" on:click={close}>Cancel</button>
        <button
          type="button"
          class="{primaryClass} min-w-0 flex-1 px-3"
          on:click={() => pick(primaryAction)}
        >
          {primaryLabel}
        </button>
      </div>

      {#if hasNext}
        <button
          type="button"
          class="cursor-pointer border-0 bg-transparent py-2 text-sm font-bold text-ink-secondary underline hover:text-ink"
          on:click={() => pick("again")}
        >
          Share again anyway
        </button>
      {/if}
    </div>
  {/if}
</AppDialog>
