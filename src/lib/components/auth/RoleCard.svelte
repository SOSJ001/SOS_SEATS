<script>
  // @ts-nocheck
  /** Role card for FR-39 selector (HI-FI 261:60 / 262:65). */
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import Ticket from "lucide-svelte/icons/ticket";
  import LayoutGrid from "lucide-svelte/icons/layout-grid";
  import QrCode from "lucide-svelte/icons/qr-code";

  /** @type {"attendee" | "organizer" | "staff"} */
  export let role;
  export let href = "#";
  export let title = "";
  export let description = "";

  const styles = {
    attendee: {
      card: "bg-[rgba(255,90,31,0.08)]",
      iconWrap: "bg-[#fff7ed]",
      Icon: Ticket,
    },
    organizer: {
      card: "bg-[rgba(59,130,246,0.08)]",
      iconWrap: "bg-[#eff6ff]",
      Icon: LayoutGrid,
    },
    staff: {
      card: "bg-[rgba(16,185,129,0.08)]",
      iconWrap: "bg-[#ecfdf5]",
      Icon: QrCode,
    },
  };

  $: s = styles[role] || styles.attendee;
  $: Icon = s.Icon;
</script>

<a
  {href}
  class="flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-paper-border p-4 shadow-[0px_2px_8px_rgba(18,4,28,0.03),0px_10px_24px_rgba(18,4,28,0.05)] no-underline {s.card} hover:opacity-95"
>
  <span
    class="flex size-10 shrink-0 items-center justify-center rounded-[20px] {s.iconWrap}"
    aria-hidden="true"
  >
    <Icon class="size-6 text-brand" strokeWidth={2} />
  </span>
  <span class="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
    <span class="w-full text-base font-extrabold leading-none text-ink">{title}</span>
    <span class="w-full text-[13px] font-normal leading-[1.4] text-ink-secondary"
      >{description}</span
    >
  </span>
  <span class="flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
    <ChevronRight class="size-4 text-brand" strokeWidth={2.5} />
  </span>
</a>
