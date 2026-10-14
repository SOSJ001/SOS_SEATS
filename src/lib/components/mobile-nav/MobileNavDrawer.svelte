<script>
  // @ts-nocheck
  /**
   * Mobile menu drawer shared by the Organiser, Attendee and public shells.
   * Slots: profile, default (main links), support, footer.
   */
  import { onDestroy } from "svelte";
  import MobileNavHeader from "./MobileNavHeader.svelte";

  export let open = false;
  /** Breakpoint from which the drawer is hidden. @type {"md" | "lg"} */
  export let hideFrom = "md";

  const hideClass = { md: "md:hidden", lg: "lg:hidden" };
  let listening = false;

  function close() {
    open = false;
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  function syncEscape(isOpen) {
    if (typeof document === "undefined") return;
    if (isOpen && !listening) {
      document.addEventListener("keydown", onKeydown);
      listening = true;
    } else if (!isOpen && listening) {
      document.removeEventListener("keydown", onKeydown);
      listening = false;
    }
  }

  $: syncEscape(open);
  onDestroy(() => syncEscape(false));
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 {hideClass[hideFrom] || 'md:hidden'}"
    role="dialog"
    aria-modal="true"
    aria-label="Menu"
  >
    <button
      type="button"
      class="absolute inset-0 h-full w-full cursor-pointer border-0 bg-ink/60"
      aria-label="Close menu"
      on:click={close}
    ></button>

    <div
      class="absolute right-0 top-0 z-10 flex h-full w-[min(292px,92vw)] flex-col overflow-y-auto bg-paper pb-8 pt-6 shadow-[-4px_0_12px_rgba(0,0,0,0.15)]"
    >
      <MobileNavHeader on:close={close} />

      <div class="flex flex-1 flex-col gap-5 px-6 pb-6 pt-4">
        <slot name="profile" />
        <nav class="flex flex-col gap-1.5" aria-label="Mobile primary">
          <slot />
        </nav>
        <slot name="support" />
      </div>

      <slot name="footer" />
    </div>
  </div>
{/if}
