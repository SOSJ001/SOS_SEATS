<script>
  // @ts-nocheck
  /**
   * Logout confirm overlay — HI-FI desktop 55:832 / mobile 36:1036 (roadmap 2.3).
   */
  import { createEventDispatcher, onDestroy } from "svelte";
  import LogOut from "lucide-svelte/icons/log-out";
  import AlertTriangle from "lucide-svelte/icons/alert-triangle";

  export let open = false;

  const dispatch = createEventDispatcher();
  let dialogEl;
  let listening = false;

  function close() {
    open = false;
    dispatch("cancel");
  }

  function confirm() {
    open = false;
    dispatch("confirm");
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

  $: if (open) {
    requestAnimationFrame(() => {
      dialogEl?.querySelector("[data-logout-focus]")?.focus();
    });
  }

  onDestroy(() => {
    if (typeof document !== "undefined" && listening) {
      document.removeEventListener("keydown", onKeydown);
      listening = false;
    }
  });
</script>

{#if open}
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-5"
    role="presentation"
    on:click|self={close}
  >
    <div
      bind:this={dialogEl}
      class="flex w-full max-w-[360px] flex-col items-center gap-4 rounded-2xl border border-paper-border bg-white px-6 py-7 text-center shadow-[0px_8px_28px_rgba(18,4,28,0.18)] lg:max-w-[400px] lg:gap-5 lg:px-8 lg:py-8"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      aria-describedby="logout-confirm-desc"
    >
      <!-- Mobile: warning; desktop: logout icon -->
      <div
        class="flex size-12 items-center justify-center rounded-full bg-[#ffe4e6] lg:hidden"
        aria-hidden="true"
      >
        <AlertTriangle class="text-[#e11d48]" size={22} strokeWidth={2} />
      </div>
      <div
        class="hidden size-12 items-center justify-center rounded-full bg-[#ffe4e6] lg:flex"
        aria-hidden="true"
      >
        <LogOut class="text-[#e11d48]" size={22} strokeWidth={2} />
      </div>

      <div class="flex w-full flex-col items-center gap-2">
        <h2
          id="logout-confirm-title"
          class="m-0 text-xl font-extrabold text-ink lg:text-[22px]"
        >
          Sign Out
        </h2>
        <p
          id="logout-confirm-desc"
          class="m-0 text-sm leading-[1.45] text-ink-secondary"
        >
          Are you sure you want to sign out?
        </p>
      </div>

      <!-- Mobile: Sign Out then Cancel (stacked) -->
      <div class="flex w-full flex-col gap-2.5 lg:hidden">
        <button
          type="button"
          class="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border-0 bg-[#e11d48] text-sm font-bold text-white hover:bg-[#be123c]"
          on:click={confirm}
        >
          Sign Out
        </button>
        <button
          type="button"
          data-logout-focus
          class="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-paper-border bg-white text-sm font-bold text-ink hover:bg-paper-cream"
          on:click={close}
        >
          Cancel
        </button>
      </div>

      <!-- Desktop: Cancel | Sign Out (row) -->
      <div class="hidden w-full gap-3 lg:flex">
        <button
          type="button"
          data-logout-focus
          class="flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-xl border border-paper-border bg-white text-sm font-bold text-ink hover:bg-paper-cream"
          on:click={close}
        >
          Cancel
        </button>
        <button
          type="button"
          class="flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-xl border-0 bg-[#e11d48] text-sm font-bold text-white hover:bg-[#be123c]"
          on:click={confirm}
        >
          Sign Out
        </button>
      </div>
    </div>
  </div>
{/if}
