<script>
  // @ts-nocheck
  import PublicIcon from "$lib/components/public/PublicIcon.svelte";

  /** Small icon-only button (attendee my-tickets header) instead of the round one. */
  export let plain = false;
  let className = "";
  export { className as class };
</script>

<button
  type="button"
  class="flex shrink-0 cursor-pointer items-center justify-center border-0 text-ink {plain
    ? 'size-6 bg-transparent p-0'
    : 'size-10 rounded-full bg-paper-border/40'} {className}"
  aria-label="Open menu"
  on:click
>
  <PublicIcon name="menu" size={plain ? 24 : 22} />
</button>
