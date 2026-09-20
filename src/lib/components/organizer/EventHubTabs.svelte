<script>
  // @ts-nocheck
  /** Hub tabs — desktop HI-FI 199:99 / mobile HI-FI 209:58. */
  export let eventId = "";
  /** @type {"overview" | "guests" | "generate"} */
  export let active = "overview";

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "guests", label: "Guests" },
    { id: "generate", label: "Generate" },
  ];

  function hrefFor(id) {
    const q = new URLSearchParams();
    q.set("id", eventId);
    if (id !== "overview") q.set("tab", id);
    return `/dashboard/events/eventDetails?${q.toString()}`;
  }
</script>

<nav
  class="flex w-full items-start gap-5 border-b border-paper-border bg-transparent px-0 lg:gap-6"
  aria-label="Event hub"
>
  {#each tabs as tab}
    <a
      href={hrefFor(tab.id)}
      class="relative flex flex-col items-start justify-center gap-2 px-1 py-2 no-underline lg:py-3
        {active === tab.id
          ? 'text-ink lg:text-brand'
          : 'text-ink-secondary hover:text-ink lg:text-[#64748b]'}"
      aria-current={active === tab.id ? "page" : undefined}
    >
      <span
        class="whitespace-nowrap text-[13px] lg:text-[15px]
          {active === tab.id ? 'font-bold' : 'font-normal lg:font-bold'}"
      >
        {tab.label}
      </span>
      <span
        class="absolute bottom-0 left-0 right-0 rounded-t
          {active === tab.id
            ? 'h-0.5 bg-brand lg:h-[3px]'
            : 'h-0.5 bg-transparent lg:h-[3px]'}"
        aria-hidden="true"
      ></span>
    </a>
  {/each}
</nav>
