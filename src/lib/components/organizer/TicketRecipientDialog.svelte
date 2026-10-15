<script>
  // @ts-nocheck
  /** "Who is this for?" before a private ticket is downloaded or shared. */
  import { createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import X from "lucide-svelte/icons/x";
  import Download from "lucide-svelte/icons/download";
  import Share2 from "lucide-svelte/icons/share-2";
  import AppDialog from "$lib/components/authed/AppDialog.svelte";
  import { maskTicketNumber } from "$lib/client/ticketLayout";

  export let open = false;
  /** @type {any} */
  export let guest = null;
  /** @type {"download" | "share"} */
  export let primary = "share";

  const MAX_NAME_LENGTH = 80;
  const DEFAULT_NAME = /^Private \d{3}$/;

  const dispatch = createEventDispatcher();
  let name = "";
  let preparedFor = null;
  /** Desktop only, so phones don't pop the keyboard over the sheet. */
  let autofocusName = false;

  $: if (open && guest && preparedFor !== guest.id) {
    preparedFor = guest.id;
    const current = String(guest.name || "").trim();
    name = DEFAULT_NAME.test(current) ? "" : current;
    autofocusName = browser && window.matchMedia("(min-width: 1024px)").matches;
  }
  $: if (!open) preparedFor = null;

  $: otherVia = primary === "download" ? "share" : "download";

  function close() {
    open = false;
    dispatch("cancel");
  }

  function confirm(via) {
    open = false;
    dispatch("confirm", { via, name: name.trim() });
  }
</script>

<AppDialog
  open={open && !!guest}
  labelledby="ticket-recipient-title"
  dense
  on:close={close}
>
  {#if guest}
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-col gap-0.5">
        <h2 id="ticket-recipient-title" class="m-0 text-lg font-extrabold text-ink">
          Who is this for?
        </h2>
        <p class="m-0 text-[13px] font-medium text-ink-muted">
          Ticket {maskTicketNumber(guest.ticketNumber || guest.id)}
        </p>
      </div>
      <button
        type="button"
        class="-mr-2 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 text-ink-muted hover:bg-paper-cream hover:text-ink"
        aria-label="Close"
        on:click={close}
      >
        <X size={18} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>

    <form class="flex flex-col gap-4" on:submit|preventDefault={() => confirm(primary)}>
      <div class="flex flex-col gap-2">
        <label for="ticket-recipient-name" class="text-sm font-bold text-ink">
          Guest name <span class="font-medium text-ink-muted">(optional)</span>
        </label>
        <div
          class="flex h-12 w-full items-center rounded-lg border-[1.5px] border-[#c7bfb8] bg-white px-4 shadow-[inset_0px_1px_2px_rgba(0,0,0,0.04)] focus-within:border-brand lg:h-10"
        >
          <input
            id="ticket-recipient-name"
            bind:value={name}
            type="text"
            maxlength={MAX_NAME_LENGTH}
            autocomplete="off"
            enterkeyhint="done"
            placeholder="e.g. Ama Kamara"
            data-autofocus={autofocusName ? "" : undefined}
            class="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:ring-0 lg:text-sm"
          />
        </div>
        <p class="m-0 text-xs text-ink-secondary">
          Shown in your guest list so you know who has this ticket.
        </p>
      </div>

      <div class="flex flex-col gap-1">
        <button
          type="submit"
          class="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-brand text-base font-extrabold text-white shadow-[0px_10px_24px_-8px_rgba(255,90,31,0.2)] hover:bg-brand/90 lg:h-10 lg:text-sm"
        >
          {#if primary === "download"}
            <Download size={18} strokeWidth={2} aria-hidden="true" />
            Download ticket
          {:else}
            <Share2 size={18} strokeWidth={2} aria-hidden="true" />
            Share ticket
          {/if}
        </button>
        <button
          type="button"
          class="flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent text-sm font-bold text-brand hover:bg-brand/5 lg:h-9"
          on:click={() => confirm(otherVia)}
        >
          {otherVia === "download" ? "Download instead" : "Share instead"}
        </button>
      </div>
    </form>
  {/if}
</AppDialog>
