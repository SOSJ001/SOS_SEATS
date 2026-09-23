<script>
  // @ts-nocheck
  /** Stats row — desktop 604:1523; mobile 610:1351 (266:68). */
  import Ticket from "lucide-svelte/icons/ticket";
  import Check from "lucide-svelte/icons/check";
  import ArrowLeftRight from "lucide-svelte/icons/arrow-left-right";

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
    {@const Icon = card.icon}
    <div
      class="flex h-[72px] flex-1 items-center gap-3 rounded-2xl border border-paper-border p-3 shadow-[0_4px_6px_rgba(0,0,0,0.03)] lg:h-auto lg:gap-3 lg:p-4 {card.bg}"
    >
      <span
        class="w-1 shrink-0 self-stretch rounded {card.bar}"
        aria-hidden="true"
      ></span>
      <div class="flex min-w-0 flex-1 flex-col gap-1 lg:gap-0.5">
        <div class="flex items-center gap-2">
          <span class="lg:hidden">
            <Icon size={16} class={card.valueClass} strokeWidth={2.25} />
          </span>
          <span class="hidden lg:inline">
            <Icon size={20} class={card.valueClass} strokeWidth={2.25} />
          </span>
          <span class="text-2xl font-extrabold leading-none {card.valueClass}">
            {card.value}
          </span>
        </div>
        <p
          class="m-0 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#666673] lg:text-xs lg:tracking-[0.8px]"
        >
          <span class="lg:hidden">{card.labelMobile}</span>
          <span class="hidden lg:inline">{card.labelDesktop}</span>
        </p>
        <p class="m-0 hidden text-xs text-ink-secondary lg:block">{card.sub}</p>
      </div>
    </div>
  {/each}
</div>
