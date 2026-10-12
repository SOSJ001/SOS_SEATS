<script>
  // @ts-nocheck
  /**
   * Scanner stats (roadmap 7.2).
   * layout "bar": ready kiosk column (55:2244). layout "compact": 2x2 grid beside a result (55:2275).
   */
  import DoorStatCard from "./DoorStatCard.svelte";
  import { formatCheckedInAt, formatClock, percent } from "./doorFormat.js";

  /** { checkedIn, total, rate, lastScanAt } */
  export let stats = { checkedIn: 0, total: 0, rate: 0, lastScanAt: null };
  export let layout = "bar";

  $: checkedIn = stats?.checkedIn ?? 0;
  $: total = stats?.total ?? 0;
  $: rate = stats?.rate ?? percent(checkedIn, total);
  $: lastScan = stats?.lastScanAt ? formatClock(stats.lastScanAt) : "--";
</script>

{#if layout === "compact"}
  <div class="grid grid-cols-2 gap-3">
    <DoorStatCard layout="compact" tone="green" label="Checked In" value={checkedIn} />
    <DoorStatCard layout="compact" tone="orange" label="Total Guests" value={total} valueClass="text-ink" />
    <DoorStatCard layout="compact" tone="orange" label="Check-in Rate" value="{rate}%" />
    <DoorStatCard layout="compact" tone="slate" label="Last Scan" value={lastScan} />
  </div>
{:else}
  <div class="flex flex-col gap-3">
    <DoorStatCard tone="green" label="Checked In" value={checkedIn} caption="Guests admitted" />
    <DoorStatCard
      tone="orange"
      label="Total Guests"
      value={total}
      caption="Tickets for this event"
      valueClass="text-ink"
    />
    <DoorStatCard tone="orange" label="Check-in Rate" value="{rate}%">
      <div class="flex flex-col gap-1.5">
        <p class="m-0 text-xs font-medium text-ink-muted">Scanned {checkedIn} / {total}</p>
        <div class="h-1.5 w-full overflow-hidden rounded-full border border-brand/30 bg-paper">
          <div class="h-full rounded-full bg-brand" style="width: {rate}%"></div>
        </div>
      </div>
    </DoorStatCard>
    <DoorStatCard
      tone="slate"
      label="Last Scan"
      value={lastScan}
      caption={stats?.lastScanAt ? formatCheckedInAt(stats.lastScanAt) : "No scans yet"}
    />
  </div>
{/if}
