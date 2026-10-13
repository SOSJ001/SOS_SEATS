<script context="module">
  /** Open staff dialogs; body scroll is locked while any are open. */
  let locks = 0;
  let savedOverflow = "";

  function lockScroll() {
    if (locks === 0) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    locks += 1;
  }

  function unlockScroll() {
    locks = Math.max(0, locks - 1);
    if (locks === 0) document.body.style.overflow = savedOverflow;
  }
</script>

<script>
  // @ts-nocheck
  /**
   * Staff dialog shell. `sheet`: bottom sheet on mobile (1540:5701), centred modal on desktop (1540:5502).
   * `center`: centred card at every size (Revoke 1540:5966 mobile, 1540:5859 desktop).
   * Dispatches `close` on Escape or overlay click.
   */
  import { createEventDispatcher, onDestroy, tick } from "svelte";

  export let open = false;
  /** id of the element that names the dialog */
  export let labelledby = undefined;
  /** `"sheet"` | `"center"` */
  export let variant = "sheet";

  const dispatch = createEventDispatcher();
  let panelEl;
  let listening = false;

  $: center = variant === "center";

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      dispatch("close");
    }
  }

  function sync() {
    if (typeof document === "undefined") return;
    if (open && !listening) {
      document.addEventListener("keydown", onKeydown);
      lockScroll();
      listening = true;
      tick().then(() => panelEl?.focus());
    } else if (!open && listening) {
      document.removeEventListener("keydown", onKeydown);
      unlockScroll();
      listening = false;
    }
  }

  $: open, sync();

  onDestroy(() => {
    open = false;
    sync();
  });
</script>

{#if open}
  <div
    class="fixed inset-0 z-[100] flex justify-center bg-[rgba(15,18,26,0.45)] lg:items-center lg:p-5 {center
      ? 'items-center p-6'
      : 'items-end'}"
    role="presentation"
    on:click|self={() => dispatch("close")}
  >
    <div
      bind:this={panelEl}
      class="flex max-h-[90vh] w-full flex-col overflow-y-auto bg-white focus:outline-none lg:rounded-[20px] lg:border lg:border-paper-border lg:p-10 lg:shadow-[0px_12px_16px_rgba(18,4,28,0.12)] {center
        ? 'max-w-[400px] gap-5 rounded-2xl p-6 shadow-[0px_12px_12px_rgba(0,0,0,0.25)] lg:gap-7'
        : 'gap-[14px] rounded-t-[20px] px-5 pb-7 pt-3 lg:max-w-[480px]'}"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledby}
      tabindex="-1"
    >
      {#if !center}
        <div class="flex w-full justify-center lg:hidden" aria-hidden="true">
          <span class="h-1 w-10 rounded-[2px] bg-[#ccccd1]" />
        </div>
      {/if}
      <slot />
    </div>
  </div>
{/if}
