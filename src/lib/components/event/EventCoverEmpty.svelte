<script>
  // @ts-nocheck
  /**
   * Placeholder for an event with no cover image (temporary; a designed empty state comes later).
   * Spans only: EventCover is used inside <button> and <label>.
   */
  import ImageOff from "lucide-svelte/icons/image-off";

  /** "dark" | "light" */
  export let tone = "dark";
  /** "label" | "icon" | "backdrop" */
  export let variant = "label";

  $: dark = tone !== "light";
</script>

<span
  class="absolute inset-0 flex flex-col items-center justify-center gap-2 {dark
    ? 'bg-slate-public bg-[radial-gradient(circle_at_30%_20%,rgba(255,90,31,0.2),transparent_60%)]'
    : 'bg-paper-cream bg-[radial-gradient(circle_at_30%_20%,rgba(255,90,31,0.08),transparent_60%)]'}"
  aria-hidden="true"
>
  {#if variant !== "backdrop"}
    <span
      class="flex items-center justify-center ring-1 {variant === 'icon'
        ? 'size-7 rounded-lg'
        : 'size-11 rounded-xl'} {dark ? 'bg-white/10 ring-white/15' : 'bg-white ring-paper-border'}"
    >
      <ImageOff class="{variant === 'icon' ? 'size-3.5' : 'size-5'} {dark ? 'text-white/70' : 'text-ink-muted'}" />
    </span>
    {#if variant === "label"}
      <span class="text-[13px] font-semibold {dark ? 'text-white/70' : 'text-ink-muted'}">No cover image</span>
    {/if}
  {/if}
</span>
