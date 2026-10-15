<script>
  // @ts-nocheck
  /** "Who is this for?" before a private ticket is downloaded or shared. */
  import { createEventDispatcher, onDestroy, tick } from "svelte";
  import UserRound from "lucide-svelte/icons/user-round";
  import Download from "lucide-svelte/icons/download";
  import Share2 from "lucide-svelte/icons/share-2";
  import { maskTicketNumber } from "$lib/client/ticketLayout";

  export let open = false;
  /** @type {any} */
  export let guest = null;
  /** @type {"download" | "share"} */
  export let primary = "share";

  const MAX_NAME_LENGTH = 80;
  const DEFAULT_NAME = /^Private \d{3}$/;

  const dispatch = createEventDispatcher();
  let inputEl;
  let name = "";
  let listening = false;
  let preparedFor = null;

  $: if (open && guest && preparedFor !== guest.id) {
    preparedFor = guest.id;
    const current = String(guest.name || "").trim();
    name = DEFAULT_NAME.test(current) ? "" : current;
    tick().then(() => inputEl?.focus());
  }
  $: if (!open) preparedFor = null;

  $: actions =
    primary === "download" ? ["download", "share"] : ["share", "download"];

  function close() {
    open = false;
    dispatch("cancel");
  }

  function confirm(via) {
    open = false;
    dispatch("confirm", { via, name: name.trim() });
  }

  function onSubmit() {
    confirm(primary);
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  function syncEscape() {
    if (typeof document === "undefined") return;
    if (open && !listening) {
      document.addEventListener("keydown", onKeydown);
      listening = true;
    } else if (!open && listening) {
      document.removeEventListener("keydown", onKeydown);
      listening = false;
    }
  }

  $: open, syncEscape();

  onDestroy(() => {
    if (typeof document !== "undefined" && listening) {
      document.removeEventListener("keydown", onKeydown);
      listening = false;
    }
  });
</script>

{#if open && guest}
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-5"
    role="presentation"
    on:click|self={close}
  >
    <form
      class="flex w-full max-w-[360px] flex-col gap-4 rounded-2xl border border-paper-border bg-white px-6 py-7 shadow-[0px_8px_28px_rgba(18,4,28,0.18)] lg:max-w-[420px] lg:gap-5 lg:px-8 lg:py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-recipient-title"
      on:submit|preventDefault={onSubmit}
    >
      <div class="flex flex-col items-center gap-3 text-center">
        <div
          class="flex size-12 items-center justify-center rounded-full bg-brand/10"
          aria-hidden="true"
        >
          <UserRound class="text-brand" size={22} strokeWidth={2} />
        </div>
        <div class="flex flex-col items-center gap-1">
          <h2
            id="ticket-recipient-title"
            class="m-0 text-xl font-extrabold text-ink lg:text-[22px]"
          >
            Who is this for?
          </h2>
          <p class="m-0 text-sm text-ink-secondary">
            Ticket {maskTicketNumber(guest.ticketNumber || guest.id)}
          </p>
        </div>
      </div>

      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-bold text-ink">Guest name (optional)</span>
        <input
          bind:this={inputEl}
          bind:value={name}
          type="text"
          maxlength={MAX_NAME_LENGTH}
          autocomplete="off"
          placeholder="e.g. Ama Kamara"
          class="h-11 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm font-medium text-ink outline-none placeholder:text-ink-secondary focus:border-brand"
        />
        <span class="text-xs text-ink-secondary">
          Shown in your guest list so you know who has this ticket.
        </span>
      </label>

      <div class="flex w-full flex-col gap-2.5 lg:flex-row lg:gap-3">
        {#each actions as via (via)}
          <button
            type={via === primary ? "submit" : "button"}
            class="flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold
              {via === primary
              ? 'border-0 bg-brand text-white hover:opacity-90'
              : 'border border-brand bg-white text-brand hover:bg-brand/5'}"
            on:click={via === primary ? undefined : () => confirm(via)}
          >
            {#if via === "download"}
              <Download size={16} aria-hidden="true" />
              Download
            {:else}
              <Share2 size={16} aria-hidden="true" />
              Share
            {/if}
          </button>
        {/each}
      </div>

      <button
        type="button"
        class="h-10 w-full cursor-pointer rounded-xl border border-paper-border bg-white text-sm font-bold text-ink hover:bg-paper-cream"
        on:click={close}
      >
        Cancel
      </button>
    </form>
  </div>
{/if}
