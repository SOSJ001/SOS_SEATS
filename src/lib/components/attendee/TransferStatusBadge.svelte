<script>
  // @ts-nocheck
  /** Transfer status badge: desktop table 606:1386 (xs), mobile card 627:1331 (sm), mobile hero 311:174 (md). */
  /** @type {"COMPLETED" | "PENDING"} */
  export let status = "COMPLETED";
  /** @type {"xs" | "sm" | "md"} */
  export let size = "xs";
  export let pill = false;

  const sizeClasses = {
    xs: "px-2.5 py-1 text-[10px] font-extrabold",
    sm: "px-2.5 py-1 text-[11px] font-bold leading-[14px]",
    md: "px-3 py-1.5 text-[13px] font-extrabold leading-4",
  };

  $: isPending = status === "PENDING";
  $: toneClass = isPending
    ? "bg-[#fff0ea] text-brand"
    : size === "xs"
      ? "bg-accent-green-soft text-[#22c55e]"
      : "bg-accent-green-soft text-[#228b5e]";
</script>

<span
  class="inline-flex w-fit shrink-0 items-center {pill ? 'rounded-full' : 'rounded'} {sizeClasses[size] || sizeClasses.xs} {toneClass}"
>
  {isPending ? "PENDING" : "COMPLETED"}
</span>
