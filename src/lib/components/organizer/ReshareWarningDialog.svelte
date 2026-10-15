<script>
  // @ts-nocheck
  /** Warns before a private ticket that was already shared goes out again. */
  import { createEventDispatcher, onDestroy } from "svelte";
  import TriangleAlert from "lucide-svelte/icons/triangle-alert";
  import { formatSharedAt, maskTicketNumber } from "$lib/client/ticketLayout";

  export let open = false;
  /** @type {any} */
  export let guest = null;
  export let hasNext = false;

  const dispatch = createEventDispatcher();
  let listening = false;

  $: viaLabel = guest?.sharedVia === "download" ? "Download" : "Share";

  function close() {
    open = false;
    dispatch("cancel");
  }

  function pick(action) {
    open = false;
    dispatch(action);
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
    <div
      class="flex w-full max-w-[360px] flex-col items-center gap-4 rounded-2xl border border-paper-border bg-white px-6 py-7 text-center shadow-[0px_8px_28px_rgba(18,4,28,0.18)] lg:max-w-[420px] lg:gap-5 lg:px-8 lg:py-8"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="reshare-warning-title"
      aria-describedby="reshare-warning-desc"
    >
      <div
        class="flex size-12 items-center justify-center rounded-full bg-[#fef3c7]"
        aria-hidden="true"
      >
        <TriangleAlert class="text-[#d97706]" size={22} strokeWidth={2} />
      </div>

      <div class="flex w-full flex-col items-center gap-2">
        <h2
          id="reshare-warning-title"
          class="m-0 text-xl font-extrabold text-ink lg:text-[22px]"
        >
          Already shared
        </h2>
        <p
          id="reshare-warning-desc"
          class="m-0 text-sm leading-[1.45] text-ink-secondary"
        >
          Ticket {maskTicketNumber(guest.ticketNumber || guest.id)} was already shared
          on {formatSharedAt(guest.sharedAt)} (via {viaLabel}). Sharing it again may
          let two people use it.
        </p>
      </div>

      <div class="flex w-full flex-col gap-2.5">
        {#if hasNext}
          <button
            type="button"
            class="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border-0 bg-brand text-sm font-bold text-white hover:opacity-90"
            on:click={() => pick("next")}
          >
            Share next unshared ticket
          </button>
        {/if}
        <button
          type="button"
          class="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-brand bg-white text-sm font-bold text-brand hover:bg-brand/5"
          on:click={() => pick("again")}
        >
          Share again anyway
        </button>
        <button
          type="button"
          class="flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-paper-border bg-white text-sm font-bold text-ink hover:bg-paper-cream"
          on:click={close}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}
