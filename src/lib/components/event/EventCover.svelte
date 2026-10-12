<script>
  // @ts-nocheck
  /**
   * Event cover image: blurred fill behind, full (contained) image on top, empty state when missing.
   * Standalone: the cover is the frame (size/radius/border via `class`).
   * Fill: `fill` makes it absolute inset-0 inside a caller's frame that holds overlays/badges.
   * Spans only: used inside <button> and <label>, which only allow inline content.
   */
  import { onMount } from "svelte";
  import EventCoverEmpty from "./EventCoverEmpty.svelte";

  /** @type {string | null | undefined} */
  export let src = null;
  export let alt = "";
  let className = "";
  export { className as class };
  export let fill = false;
  /** "dark" | "light" (empty state only) */
  export let tone = "dark";
  /** "label" | "icon" | "backdrop" */
  export let empty = "label";
  /** "lazy" | "eager" */
  export let loading = "lazy";

  let img;
  let failed = false;

  $: src, (failed = false);

  // Server-rendered images can fail before on:error is attached.
  onMount(() => {
    if (img?.complete && img.naturalWidth === 0) failed = true;
  });
</script>

<span
  class="{fill ? 'absolute inset-0' : 'relative'} block overflow-hidden {className}"
  {...$$restProps}
>
  {#if src && !failed}
    <img
      {src}
      alt=""
      aria-hidden="true"
      {loading}
      class="pointer-events-none absolute inset-0 size-full max-w-none scale-110 object-cover blur-xl"
    />
    <img
      bind:this={img}
      {src}
      {alt}
      {loading}
      class="absolute inset-0 size-full max-w-none object-contain"
      on:error={() => (failed = true)}
    />
  {:else}
    <EventCoverEmpty {tone} variant={empty} />
  {/if}
</span>
