<script>
  // @ts-nocheck
  /**
   * You Might Also Like — related cards or empty state (Figma 1149:2185).
   * Heart/Save is visual only.
   */
  import Heart from "lucide-svelte/icons/heart";

  /** @type {Array<Record<string, any>>} */
  export let events = [];

  $: hasEvents = !!(events && events.length);

  function formatDate(d, time) {
    if (!d) return "";
    try {
      const date = new Date(d);
      const day = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (time) return `${day} • ${time}`;
      return day;
    } catch {
      return String(d);
    }
  }

  function priceLabel(ev) {
    if (!ev) return "See tickets";
    if (ev.is_free_event || ev.price === 0 || ev.price === "Free") return "Free";
    if (typeof ev.price === "string" && ev.price.includes("NLe")) {
      return ev.price.startsWith("From") ? ev.price : `From ${ev.price}`;
    }
    if (typeof ev.price === "number") return `From NLe ${ev.price}`;
    if (ev.minPrice != null) return `From NLe ${ev.minPrice}`;
    return "See tickets";
  }

  function imageUrl(ev) {
    return (
      ev?.imageUrl ||
      ev?.image ||
      ev?.Image?.publicUrl ||
      ev?.Image?.file_path ||
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop"
    );
  }
</script>

<section class="flex w-full flex-col gap-4">
  <div class="flex items-center justify-between gap-4">
    <h2 class="m-0 font-display text-[22px] font-bold text-ink">
      You Might Also Like
    </h2>
    <a
      href="/marketplace"
      class="shrink-0 text-[13px] font-extrabold text-brand no-underline hover:underline"
    >
      See all
    </a>
  </div>

  {#if hasEvents}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each events as ev (ev.id)}
        <a
          href="/marketplace/eventDetails/{ev.id}"
          class="flex flex-col gap-3 rounded-2xl border border-paper-border bg-paper p-3 text-inherit no-underline shadow-[0px_8px_10px_rgba(0,0,0,0.05)] transition-transform hover:-translate-y-0.5"
        >
          <div class="relative h-[140px] w-full overflow-hidden rounded-xl bg-paper-border">
            <img
              src={imageUrl(ev)}
              alt=""
              loading="lazy"
              class="absolute inset-0 size-full max-w-none object-cover"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <p class="m-0 text-sm font-extrabold text-ink">{ev.name}</p>
            <p class="m-0 text-xs text-ink-secondary">
              {formatDate(ev.date, ev.time)}
            </p>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[13px] font-extrabold text-brand">{priceLabel(ev)}</span>
            <span
              class="inline-flex items-center gap-1.5 text-xs text-ink-secondary"
              aria-hidden="true"
            >
              <Heart size={16} />
              Save
            </span>
          </div>
        </a>
      {/each}
    </div>
  {:else}
    <div
      class="relative flex w-full flex-col items-center overflow-hidden rounded-3xl border border-[#ece6df] bg-white py-12"
    >
      <div
        class="pointer-events-none absolute left-[-120px] top-[-60px] size-80 rounded-full border border-[#ece6df]"
        aria-hidden="true"
      ></div>
      <div
        class="pointer-events-none absolute right-[-100px] top-[120px] size-[280px] rounded-full border border-[#ece6df]"
        aria-hidden="true"
      ></div>
      <div
        class="pointer-events-none absolute bottom-[-140px] left-1/2 size-[420px] -translate-x-1/2 rounded-full border border-[#ece6df]"
        aria-hidden="true"
      ></div>

      <div class="relative z-10 flex w-full max-w-[480px] flex-col items-center gap-3 px-5 text-center">
        <p class="m-0 text-2xl font-extrabold text-ink">No similar events found</p>
        <p class="m-0 text-[15px] font-normal leading-6 text-ink-secondary">
          There aren’t any similar events to show right now. Check back later or browse
          other events.
        </p>
      </div>
    </div>
  {/if}
</section>
