<script>
  // @ts-nocheck
  /**
   * "..." overflow menu on the organiser event card: Share, and Publish for drafts.
   */
  import { createEventDispatcher } from "svelte";
  import Ellipsis from "lucide-svelte/icons/ellipsis";
  import Share2 from "lucide-svelte/icons/share-2";
  import Send from "lucide-svelte/icons/send";

  /** @type {string | number} */
  export let eventId;
  export let eventTitle = "event";
  export let canPublish = false;
  /** Tailwind classes for the trigger button background. */
  export let triggerClass = "bg-paper";

  const dispatch = createEventDispatcher();

  let open = false;
  let root;
  let trigger;

  function toggle() {
    open = !open;
  }

  function close(focusTrigger = false) {
    open = false;
    if (focusTrigger) trigger?.focus();
  }

  function onShare() {
    close();
    dispatch("share");
  }

  /** @param {MouseEvent} e */
  function onWindowClick(e) {
    if (open && root && !root.contains(e.target)) close();
  }

  /** @param {KeyboardEvent} e */
  function onWindowKeydown(e) {
    if (open && e.key === "Escape") close(true);
  }
</script>

<svelte:window on:click={onWindowClick} on:keydown={onWindowKeydown} />

<div class="relative" bind:this={root}>
  <button
    bind:this={trigger}
    type="button"
    class="flex cursor-pointer items-center rounded-lg border border-paper-border px-2.5 py-1.5 text-ink-secondary transition-colors hover:text-ink {triggerClass}"
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label="More actions for {eventTitle}"
    on:click={toggle}
  >
    <Ellipsis class="size-4" aria-hidden="true" />
  </button>

  {#if open}
    <div
      class="absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-paper-border bg-paper py-1 shadow-public-card"
      role="menu"
    >
      <button
        type="button"
        role="menuitem"
        class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-ink hover:bg-paper-cream"
        on:click={onShare}
      >
        <Share2 class="size-4 text-ink-secondary" aria-hidden="true" />
        Share
      </button>
      {#if canPublish}
        <a
          href="/dashboard/events/editEvent/{eventId}/step5"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-semibold text-brand no-underline hover:bg-paper-cream"
          on:click={() => close()}
        >
          <Send class="size-4" aria-hidden="true" />
          Publish
        </a>
      {/if}
    </div>
  {/if}
</div>
