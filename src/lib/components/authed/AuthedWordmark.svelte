<script>
  // @ts-nocheck
  /** Split SOS SEATS mark (matches PublicTopBar). variant: light | dark */
  export let variant = "light";
  export let href = "/dashboard";

  $: seatsClass = variant === "dark" ? "text-white" : "text-ink-seats";
</script>

<a {href} class="flex items-center gap-2 h-[25px]" aria-label="SOS SEATS">
  <span class="w-1 h-[18px] rounded-sm bg-brand shrink-0" aria-hidden="true"></span>
  <span class="font-logo font-black tracking-[2px] text-[20px] leading-none whitespace-nowrap">
    <span class="text-brand">SOS</span><span class={seatsClass}> SEATS</span>
  </span>
</a>
