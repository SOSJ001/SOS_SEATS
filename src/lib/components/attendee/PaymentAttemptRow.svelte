<script>
  // @ts-nocheck
  /**
   * One marketplace payment attempt (My Tickets, Payments tab).
   * Row shape: PaymentAttemptRow from $lib/server/tickets.
   */
  import CircleCheck from "lucide-svelte/icons/circle-check";
  import Clock from "lucide-svelte/icons/clock";
  import TriangleAlert from "lucide-svelte/icons/triangle-alert";
  import CircleX from "lucide-svelte/icons/circle-x";
  import Ban from "lucide-svelte/icons/ban";
  import TimerOff from "lucide-svelte/icons/timer-off";
  import Smartphone from "lucide-svelte/icons/smartphone";
  import Ticket from "lucide-svelte/icons/ticket";
  import ChevronRight from "lucide-svelte/icons/chevron-right";

  export let payment;

  const STATUS = {
    paid: { label: "Paid", icon: CircleCheck, tone: "bg-accent-green-soft text-[#22c55e]" },
    waiting: { label: "Waiting for payment", icon: Clock, tone: "bg-[#fff7ed] text-[#ea580c]" },
    paid_no_tickets: {
      label: "Paid, tickets not created",
      icon: TriangleAlert,
      tone: "bg-[#fef2f2] text-[#dc2626]",
    },
    failed: { label: "Failed", icon: CircleX, tone: "bg-[#fef2f2] text-[#dc2626]" },
    cancelled: { label: "Cancelled", icon: Ban, tone: "bg-[#f3f4f6] text-[#6b7280]" },
    expired: { label: "Expired", icon: TimerOff, tone: "bg-[#f3f4f6] text-[#6b7280]" },
  };

  $: status = STATUS[payment?.status] || STATUS.expired;
  $: isPaid = payment?.status === "paid" && payment?.orderId;
  $: href = isPaid
    ? `/marketplace/eventDetails/${payment.eventId}/checkout/success?orderId=${payment.orderId}`
    : null;
  $: methodLabel =
    payment?.paymentMethod === "orange_money"
      ? "Orange Money"
      : payment?.paymentMethod === "afrimoney"
        ? "Afrimoney"
        : "Mobile Money";
  $: amountLabel = `NLe ${(Number(payment?.amount) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  $: dateLabel = (() => {
    const d = new Date(payment?.createdAt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  })();
</script>

<svelte:element
  this={href ? "a" : "article"}
  {href}
  class="flex w-full flex-col gap-3 rounded-2xl border border-paper-border bg-paper p-4 text-inherit no-underline shadow-[0_6px_9px_rgba(0,0,0,0.05)] lg:flex-row lg:items-center lg:gap-4 lg:shadow-[0_4px_8px_rgba(0,0,0,0.03)] {href
    ? 'cursor-pointer hover:border-brand/40'
    : ''}"
>
  <div class="flex min-w-0 flex-1 flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2.5">
      <span
        class="inline-flex items-center gap-1 rounded-[30px] px-2.5 py-1 text-[11px] font-extrabold lg:py-0.5 {status.tone}"
      >
        <svelte:component this={status.icon} size={12} strokeWidth={2.5} aria-hidden="true" />
        {status.label}
      </span>
      <span class="text-[13px] font-bold text-ink">{amountLabel}</span>
    </div>
    <h3 class="m-0 text-base font-extrabold text-ink lg:text-lg">{payment.eventName}</h3>
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-ink-secondary">
      <span class="flex items-center gap-1.5">
        <Ticket size={12} strokeWidth={2.25} aria-hidden="true" />
        {payment.ticketsLabel}
      </span>
      <span class="flex items-center gap-1.5">
        <Smartphone size={12} strokeWidth={2.25} aria-hidden="true" />
        {methodLabel}
      </span>
      {#if dateLabel}
        <span>{dateLabel}</span>
      {/if}
    </div>
    {#if payment.status === "paid_no_tickets"}
      <p class="m-0 text-xs font-semibold text-[#dc2626]">
        Your payment was received but tickets could not be created. Please contact support.
      </p>
    {/if}
  </div>

  {#if href}
    <span class="flex shrink-0 items-center gap-1 text-xs font-bold text-brand">
      View receipt
      <ChevronRight size={14} strokeWidth={2.5} aria-hidden="true" />
    </span>
  {/if}
</svelte:element>
