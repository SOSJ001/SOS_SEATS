<script>
  // @ts-nocheck
  import PublicIcon from "$lib/components/public/PublicIcon.svelte";

  export let event;
  export let compact = false;

  $: title = event?.name || event?.Event?.name || "Untitled event";
  $: venue = event?.venue || event?.Event?.venue || event?.location || "";
  $: dateRaw = event?.date || event?.Event?.date || event?.event_date || "";
  $: category = event?.category || event?.Event?.category || "";
  $: image =
    event?.imageUrl ||
    event?.Image?.publicUrl ||
    event?.Image?.file_path ||
    event?.image ||
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop";
  $: href = event?.showcase
    ? "/marketplace"
    : event?.id || event?.Event?.id
      ? `/marketplace/eventDetails/${event?.id || event?.Event?.id}`
      : "/marketplace";
  $: priceLabel = formatPrice(event);
  $: badgeTone = /tech/i.test(category)
    ? "blue"
    : /sport/i.test(category)
      ? "green"
      : "orange";

  function formatPrice(ev) {
    if (!ev) return "See tickets";
    const e = ev.Event || ev;
    if (ev.is_free_event || e.is_free_event || ev.price === 0 || ev.price === "Free") {
      return "Free (RSVP)";
    }
    if (ev.priceLabel) return ev.priceLabel;
    if (typeof ev.price === "string" && ev.price.includes("NLe")) {
      return ev.price.replace(/\s*[–—]\s*/g, " - ");
    }
    if (ev.minPrice != null && ev.maxPrice != null && ev.minPrice !== ev.maxPrice) {
      return `NLe ${ev.minPrice} - NLe ${ev.maxPrice}`;
    }
    if (ev.price != null && typeof ev.price === "number") {
      return `NLe ${ev.price}`;
    }
    if (e.ticket_price != null) return `NLe ${e.ticket_price}`;
    return "See tickets";
  }

  function formatDate(d) {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(d);
    }
  }

  $: badgeClass =
    badgeTone === "blue"
      ? "bg-accent-blue"
      : badgeTone === "green"
        ? "bg-green-600"
        : "bg-brand";
</script>

<article
  class="bg-paper border border-paper-border rounded-2xl overflow-hidden shadow-public-card transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-public-step {compact
    ? ''
    : ''}"
>
  <a {href} class="flex flex-col h-full text-inherit">
    <div class="relative h-[160px] md:h-[260px] overflow-hidden bg-paper-border">
      <img src={image} alt="" loading="lazy" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-public-card-image pointer-events-none" aria-hidden="true"></div>
      {#if category}
        <span
          class="absolute top-2.5 left-2.5 z-[1] hidden {badgeClass} text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md md:top-4 md:left-4 md:inline-flex md:text-xs md:py-1.5"
        >
          {category}
        </span>
      {/if}
    </div>
    <div class="px-4 md:px-5 pt-4 pb-4 md:pb-5 flex flex-col gap-3 md:gap-3 flex-1">
      <h3 class="m-0 text-lg font-extrabold leading-[1.2] text-ink md:text-xl">
        {title}
      </h3>
      <div class="flex flex-col gap-1.5">
        {#if dateRaw}
          <span class="flex items-center gap-1.5 md:gap-2 text-[13px] md:text-sm text-ink-secondary">
            <PublicIcon name="calendar" size={14} />
            {formatDate(dateRaw)}
          </span>
        {/if}
        {#if venue}
          <span class="flex items-center gap-1.5 md:gap-2 text-[13px] md:text-sm text-ink-secondary">
            <PublicIcon name="map-pin" size={14} />
            {venue}
          </span>
        {/if}
      </div>
      <div
        class="flex items-center justify-between mt-auto border-t border-paper-border pt-2 md:border-0 md:pt-2"
      >
        <span class="font-extrabold text-[15px] text-ink md:text-sm md:font-extrabold"
          >{priceLabel}</span
        >
        <span
          class="bg-brand text-white text-[13px] font-bold md:font-extrabold px-[18px] md:px-[22px] py-2 md:py-2.5 rounded-xl shadow-public-cta"
        >
          View
        </span>
      </div>
    </div>
  </a>
</article>
