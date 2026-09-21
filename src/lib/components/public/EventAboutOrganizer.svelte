<script>
  // @ts-nocheck
  /**
   * About + organiser for marketplace event detail.
   * Figma 759:1333 AboutSection.
   * Verified / past events / bio are static placeholders for now (777:1399, 779:1332).
   */
  import CircleCheck from "lucide-svelte/icons/circle-check";

  export let description = "";
  export let organizerName = "";
  /** Static for now — wire to real data later */
  export let verified = true;
  /** @type {number | null} */
  export let pastEventsCount = 12;
  export let bio =
    "Bringing world-class entertainment to Sierra Leone since 2019.";

  $: trimmedDescription = (description || "").trim();
  $: trimmedOrganizer = (organizerName || "").trim();
  $: initials = (() => {
    const name = trimmedOrganizer;
    if (!name) return "?";
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  $: showOrganizer = !!trimmedOrganizer;
  $: showBlock = !!(trimmedDescription || showOrganizer);
</script>

{#if showBlock}
  <div
    class="flex w-full flex-col gap-3 rounded-2xl border border-paper-border bg-paper p-5 shadow-[0px_2px_4px_rgba(0,0,0,0.03),0px_12px_14px_rgba(0,0,0,0.08)] lg:gap-4 lg:p-6 lg:shadow-[0px_6px_9px_rgba(0,0,0,0.05)]"
  >
    {#if trimmedDescription}
      <div class="flex flex-col gap-2">
        <p
          class="m-0 text-[14px] font-extrabold leading-[1.4] text-ink lg:text-[15px] lg:font-medium lg:leading-[22px] lg:text-ink-secondary"
        >
          {trimmedDescription}
        </p>
      </div>
    {/if}

    {#if showOrganizer}
      <div
        class="flex items-center gap-3 rounded-2xl border border-paper-border bg-[#faf9f7] p-3.5 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] lg:gap-4 lg:bg-paper-cream lg:p-4 lg:shadow-[0px_10px_12px_rgba(0,0,0,0.05)]"
      >
        <div
          class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ffb800] text-base font-extrabold text-ink lg:size-14 lg:rounded-2xl lg:text-lg"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-0.5 lg:gap-2">
          <p class="m-0 text-sm font-extrabold text-ink lg:text-base">
            {trimmedOrganizer}
          </p>

          <div class="flex flex-wrap items-center gap-1.5 lg:gap-2">
            {#if verified}
              <span
                class="inline-flex items-center gap-1.5 text-xs font-normal text-ink-secondary lg:rounded-full lg:bg-white/10 lg:px-2 lg:py-1 lg:font-bold lg:text-ink"
              >
                <CircleCheck
                  size={14}
                  class="text-[#16a34a] lg:text-[#ffb800]"
                  aria-hidden="true"
                />
                Verified Local Organiser{#if pastEventsCount != null}<span
                    class="lg:hidden"
                  >
                    · {pastEventsCount} Past Events</span
                  >{/if}
              </span>
            {/if}
            {#if pastEventsCount != null}
              <span class="hidden text-xs font-normal text-ink-secondary lg:inline"
                >· {pastEventsCount} Past Events</span
              >
            {/if}
          </div>

          {#if bio}
            <p
              class="m-0 text-[11px] font-normal leading-normal text-ink-secondary lg:text-[13px] lg:font-medium lg:text-ink-body"
            >
              {bio}
            </p>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}
