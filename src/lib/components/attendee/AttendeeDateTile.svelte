<script>
  // @ts-nocheck
  /**
   * Month/day tile.
   * soft: My Tickets past 611:1413, Transfer History card 627:1331.
   * outlined: Transfer Successful ticket strip 658:1337 (mobile 680:1478 via sizeClass).
   */
  export let month = "";
  export let day = "";
  /** Month text colour, e.g. "text-[#21b873]". */
  export let monthClass = "text-[#999]";
  /** Extra classes on the root, e.g. "lg:hidden". */
  export let className = "";
  /** @type {"soft" | "outlined"} */
  export let variant = "soft";
  /** Width + height + radius override, e.g. "h-[72px] w-14 rounded-[10px]". */
  export let sizeClass = "";

  $: defaultSizeClass =
    variant === "outlined" ? "h-16 w-12 rounded-lg lg:h-14" : "h-[52px] w-12 rounded-[10px]";
  $: surfaceClass =
    variant === "outlined" ? "border border-paper-border bg-paper" : "bg-[#f7f7f7]";
  $: dayClass =
    variant === "outlined"
      ? "font-display text-lg font-bold leading-none text-ink"
      : "text-xl font-extrabold leading-none text-[#262626]";
</script>

<div
  class="flex shrink-0 flex-col items-center justify-center overflow-hidden px-1 py-1.5 text-center {sizeClass ||
    defaultSizeClass} {surfaceClass} {className}"
  data-name="Date-Tile"
>
  <p class="m-0 text-[10px] font-bold uppercase {monthClass}">{month}</p>
  <p class="m-0 {dayClass}">{day}</p>
</div>
