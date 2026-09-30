<script>
  // @ts-nocheck
  /** Transfers stats row: desktop 604:1599, mobile 624:1369 / History 626:1369. */
  import Share2 from "lucide-svelte/icons/share-2";
  import CircleCheck from "lucide-svelte/icons/circle-check";
  import AttendeeStatCard from "./AttendeeStatCard.svelte";

  /** @type {{ total: number; completed: number }} */
  export let stats = { total: 0, completed: 0 };
  /** "Pending & completed" on New Transfer (604:1599), "All time transfers" on History (606:1343). */
  export let totalSub = "Pending & completed";
</script>

<div class="flex w-full gap-3 lg:gap-4" data-node-id="604:1599">
  <AttendeeStatCard
    icon={Share2}
    value={stats.total}
    label="Total Transfers"
    sub={totalSub}
    subMobile
    bar="bg-brand"
    valueClass="text-brand"
    bg="bg-[#fff4ed]"
  />
  <AttendeeStatCard
    icon={CircleCheck}
    value={stats.completed}
    label="Completed"
    sub="Successfully transferred"
    subMobile
    bar="bg-[#00e676]"
    valueClass="text-[#00e676]"
    bg="bg-accent-green-soft"
  />
</div>
