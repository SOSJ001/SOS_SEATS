<script>
  // @ts-nocheck
  import { formatSharedAt } from "$lib/client/ticketLayout";

  /** @type {any} */
  export let guest = null;

  $: sharedLabel = guest?.sharedAt ? formatSharedAt(guest.sharedAt) : "";
  $: viaLabel = guest?.sharedVia === "download" ? "Downloaded" : "Shared";
</script>

{#if guest?.sharedAt}
  <span
    class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-2.5 py-1 text-[11px] font-extrabold bg-[#dcfce7] text-[#16a34a]"
    title="{viaLabel} {sharedLabel}{guest.shareCount > 1 ? `, ${guest.shareCount} times` : ''}"
  >
    Shared · {sharedLabel}{#if guest.shareCount > 1}<span class="opacity-80">&nbsp;x{guest.shareCount}</span>{/if}
  </span>
{:else}
  <span
    class="inline-flex shrink-0 items-center whitespace-nowrap rounded px-2.5 py-1 text-[11px] font-extrabold bg-paper-cream text-ink-secondary"
  >
    Not shared
  </span>
{/if}
