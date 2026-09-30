<script>
  // @ts-nocheck
  /** Stats row — desktop 604:1523; mobile 610:1351 (266:68). */
  import Ticket from "lucide-svelte/icons/ticket";
  import Check from "lucide-svelte/icons/check";
  import ArrowLeftRight from "lucide-svelte/icons/arrow-left-right";
  import AttendeeStatCard from "./AttendeeStatCard.svelte";

  /** @type {{ upcoming: number; past: number; transfer: number }} */
  export let stats = { upcoming: 0, past: 0, transfer: 0 };

  $: cards = [
    {
      value: stats.upcoming,
      labelMobile: "Upcoming",
      labelDesktop: "Upcoming",
      sub: "Active passes",
      icon: Ticket,
      bar: "bg-brand",
      valueClass: "text-brand",
      bg: "bg-[#fff4ed]",
    },
    {
      value: stats.past,
      labelMobile: "Past",
      labelDesktop: "Past Events",
      sub: "Attended festivals",
      icon: Check,
      bar: "bg-[#00e676]",
      valueClass: "text-[#00e676]",
      bg: "bg-accent-green-soft",
    },
    {
      value: stats.transfer,
      labelMobile: "Transfer",
      labelDesktop: "Transfer",
      sub: "Shared with friends",
      icon: ArrowLeftRight,
      bar: "bg-[#3b82d9]",
      valueClass: "text-[#3b82d9]",
      bg: "bg-[#f0f9ff]",
    },
  ];
</script>

<div
  class="flex w-full flex-row gap-2.5 lg:gap-4"
  data-node-id="610:1351"
>
  {#each cards as card}
    <AttendeeStatCard
      icon={card.icon}
      value={card.value}
      label={card.labelDesktop}
      labelMobile={card.labelMobile}
      sub={card.sub}
      bar={card.bar}
      valueClass={card.valueClass}
      bg={card.bg}
    />
  {/each}
</div>
