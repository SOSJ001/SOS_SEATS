<script>
  // @ts-nocheck
  /** Recent scans for one event (roadmap 7.2, 55:2244). Newest first. */
  import Inbox from "lucide-svelte/icons/inbox";
  import Check from "lucide-svelte/icons/check";
  import { formatScanTime } from "./doorFormat.js";

  /** [{ id, guestName, ticketType, checkInTime }] */
  export let scans = [];
</script>

<div class="flex flex-col gap-3 rounded-2xl border border-paper-border bg-[#f8f5f2] p-4">
  <h2 class="m-0 text-base font-extrabold text-ink">Recent Scans</h2>

  {#if scans?.length}
    <ul class="m-0 flex list-none flex-col gap-2 p-0">
      {#each scans as scan (scan.id)}
        <li class="flex items-center gap-3 rounded-xl border border-paper-border bg-paper px-3 py-2.5">
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-green-soft text-[#16a34a]"
            aria-hidden="true"
          >
            <Check class="size-4" strokeWidth={3} />
          </span>
          <div class="min-w-0 flex-1">
            <p class="m-0 truncate text-sm font-bold text-ink">{scan.guestName || "Guest"}</p>
            <p class="m-0 truncate text-xs font-medium text-ink-secondary">{scan.ticketType || "-"}</p>
          </div>
          <span class="shrink-0 text-xs font-semibold text-ink-muted">{formatScanTime(scan.checkInTime)}</span>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="flex flex-col items-center gap-3 rounded-xl bg-paper px-4 py-8 text-center">
      <span class="flex size-14 items-center justify-center rounded-full bg-[#f8f5f2]" aria-hidden="true">
        <Inbox class="size-6 text-ink-muted" />
      </span>
      <p class="m-0 text-sm font-bold text-ink">No scans yet</p>
      <p class="m-0 text-sm text-ink-secondary">Scanned tickets will appear here as they are processed.</p>
    </div>
  {/if}
</div>
