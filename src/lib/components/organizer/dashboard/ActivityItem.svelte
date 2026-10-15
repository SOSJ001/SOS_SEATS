<script>
  // @ts-nocheck
  /**
   * Recent Activity row (HI-FI activity-item 1615:201).
   */
  import Ticket from "lucide-svelte/icons/ticket";
  import Users from "lucide-svelte/icons/users";
  import Calendar from "lucide-svelte/icons/calendar";
  import TicketCheck from "lucide-svelte/icons/ticket-check";

  /** "ticket_sale" | "check_in" | "event_created" | "private_issue" */
  export let type = "ticket_sale";
  export let message = "";
  export let details = "";
  export let time = "";
  export let showConnector = true;

  const ICONS = {
    ticket_sale: Ticket,
    check_in: Users,
    event_created: Calendar,
    private_issue: TicketCheck,
  };
  $: icon = ICONS[type] || Calendar;
</script>

<div class="flex items-start gap-3 pb-4">
  <div class="flex shrink-0 flex-col items-center gap-1 self-stretch">
    <div class="flex size-8 items-center justify-center rounded-full bg-[#fff0eb] lg:size-9">
      <svelte:component this={icon} class="size-4 text-brand lg:size-[18px]" aria-hidden="true" />
    </div>
    {#if showConnector}
      <div class="w-0.5 flex-1 rounded-[1px] bg-paper-border"></div>
    {/if}
  </div>
  <div class="flex min-w-0 flex-1 flex-col gap-0.5 pt-px">
    <p class="m-0 text-[13px] font-semibold text-ink">{message}</p>
    {#if details}
      <p class="m-0 text-[12px] leading-4 text-ink-secondary">{details}</p>
    {/if}
    <p class="m-0 text-[11px] leading-[14px] text-ink-muted">{time}</p>
  </div>
</div>
