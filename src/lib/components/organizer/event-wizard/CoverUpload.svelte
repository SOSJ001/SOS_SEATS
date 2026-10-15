<script>
  // @ts-nocheck
  /** Cover image picker for the event wizard (mobile compact / desktop panel). */
  import Image from "lucide-svelte/icons/image";
  import LoaderCircle from "lucide-svelte/icons/loader-circle";
  import EventCover from "$lib/components/event/EventCover.svelte";

  /** @type {"compact" | "panel"} */
  export let variant = "compact";
  export let imagePreview = null;
  export let compressing = false;
  export let error = "";

  $: panel = variant === "panel";
</script>

<label
  class="flex cursor-pointer flex-col items-center justify-center overflow-hidden border-dashed bg-white transition hover:bg-brand-wash
    {panel
    ? 'min-h-[280px] flex-1 gap-3 rounded-xl border-[1.5px] border-brand lg:min-h-[464px]'
    : 'min-h-[120px] gap-2 rounded-lg border-[1.5px] border-paper-border'}
    {imagePreview ? 'p-0' : panel ? 'p-8' : 'p-5'}"
>
  {#if compressing}
    <LoaderCircle
      class="animate-spin text-brand"
      size={panel ? 36 : 24}
      strokeWidth={1.75}
      aria-hidden="true"
    />
    <span class="text-center text-[13px] font-semibold text-brand">Preparing image…</span>
  {:else if imagePreview}
    <EventCover
      src={imagePreview}
      alt="Cover preview"
      loading="eager"
      class={panel ? "min-h-[280px] w-full flex-1 lg:min-h-[400px]" : "h-[160px] w-full"}
    />
    <span
      class="w-full bg-white text-center font-bold text-brand
        {panel ? 'py-3 text-[15px]' : 'py-2 text-[13px] font-semibold'}"
    >
      Replace image
    </span>
  {:else}
    <Image class="text-brand" size={panel ? 36 : 24} strokeWidth={1.75} aria-hidden="true" />
    <span
      class="text-center text-brand {panel ? 'text-[15px] font-bold' : 'text-[13px] font-semibold'}"
    >
      Click to upload event flyer
    </span>
    <span class="text-center text-ink-secondary {panel ? 'text-xs' : 'text-[11px]'}">
      {panel ? "Recommended aspect ratio: 16:9 (Max size 5MB)" : "Recommended ratio: 16:9 (Max 5MB)"}
    </span>
  {/if}
  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    class="sr-only"
    disabled={compressing}
    on:change
  />
</label>
{#if error}
  <p class="m-0 text-sm text-red-600">{error}</p>
{/if}
