<script>
  // @ts-nocheck
  /** Auth wordmark (HI-FI Logo). href defaults to home. */
  export let href = "/";
  /** `"default"` | `"mobile"` — mobile matches Figma 4:325 (22px / bar 6×24). */
  export let size = "default";

  $: isMobile = size === "mobile";
</script>

<a
  {href}
  class="inline-flex items-center {isMobile ? 'gap-3' : 'gap-2'}"
  aria-label="SOS SEATS home"
>
  <span
    class="shrink-0 bg-brand {isMobile
      ? 'h-6 w-1.5 rounded-[3px]'
      : 'h-[18px] w-1 rounded-sm'}"
    aria-hidden="true"
  ></span>
  <span
    class="leading-none tracking-[2px] whitespace-nowrap {isMobile
      ? 'font-public text-[22px] font-extrabold'
      : 'font-logo text-[20px] font-black'}"
  >
    <span class="text-brand">SOS</span><span class={isMobile ? "text-ink" : "text-ink-seats"}>
      {" "}SEATS</span
    >
  </span>
</a>
