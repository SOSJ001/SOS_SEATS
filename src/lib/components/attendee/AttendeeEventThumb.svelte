<script>
  // @ts-nocheck
  /** Event thumbnail: blur fill + contain (event-image-blur-contain rule), slate fallback. */
  /** @type {string | null} */
  export let src = null;
  /** Size + radius classes, e.g. "size-12 rounded-xl". */
  export let sizeClass = "size-12 rounded-xl";
</script>

<span class="relative block shrink-0 overflow-hidden {sizeClass}">
  {#if src}
    <img
      {src}
      alt=""
      class="pointer-events-none absolute inset-0 size-full max-w-none scale-110 object-cover blur-xl"
      aria-hidden="true"
    />
    <img {src} alt="" class="absolute inset-0 size-full max-w-none object-contain" />
  {:else}
    <span class="absolute inset-0 block bg-slate-public" aria-hidden="true"></span>
  {/if}
</span>
