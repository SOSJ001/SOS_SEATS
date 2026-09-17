<script>
  // @ts-nocheck
  export let disabled = false;
  export let type = "submit";
  /** `"default"` | `"mobile"` — mobile matches Figma 4:325 (52px / rounded-xl). */
  export let size = "default";

  $: isMobile = size === "mobile";
</script>

<button
  {type}
  {disabled}
  class="w-full cursor-pointer border-0 bg-brand font-extrabold text-white hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 {isMobile
    ? 'h-[52px] rounded-xl text-[15px] shadow-[0px_2px_6px_rgba(0,0,0,0.08),0px_10px_24px_rgba(255,90,31,0.2)]'
    : 'h-[var(--auth-btn-h)] rounded-[var(--auth-btn-radius)] text-sm shadow-[0px_2px_6px_rgba(0,0,0,0.08),0px_10px_24px_rgba(255,90,31,0.15)]'}"
>
  <slot />
</button>
