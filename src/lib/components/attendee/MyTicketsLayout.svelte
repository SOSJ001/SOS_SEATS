<script>
  // @ts-nocheck
  /**
   * My Tickets layout — desktop 604:1490 / mobile 266:68 (shell owns chrome).
   * Dense desktop bias per hifi-density.mdc; mobile HI-FI below lg.
   */
  import MyTicketsHighlight from "./MyTicketsHighlight.svelte";
  import MyTicketsStats from "./MyTicketsStats.svelte";
  import MyTicketsTicketRow from "./MyTicketsTicketRow.svelte";

  export let userName = "Attendee";
  /** @type {any} */
  export let highlight = null;
  /** @type {any} */
  export let pastHighlight = null;
  /** @type {{ upcoming: number; past: number; transfer: number }} */
  export let stats = { upcoming: 0, past: 0, transfer: 0 };
  /** @type {any[]} */
  export let upcoming = [];
  /** @type {any[]} */
  export let past = [];
  /** @type {"upcoming" | "past"} */
  export let tab = "upcoming";
  /** @type {(ticket: any) => void} */
  export let onShowQr = () => {};
  /** @type {(ticket: any) => void} */
  export let onAddToCalendar = () => {};
  /** @type {(ticket: any) => void} */
  export let onTransfer = () => {};
  /** @type {(ticket: any) => void} */
  export let onDownload = () => {};
  /** @type {(ticket: any) => void} */
  export let onViewTicket = () => {};
  /** @type {() => void} */
  export let onFeedback = () => {};
  /** @type {(ticket: any) => void} */
  export let onViewDetails = () => {};
  /** @type {(next: "upcoming" | "past") => void} */
  export let onTabChange = () => {};

  const pageSize = 4;
  let pageIndex = 0;

  $: displayName = userName?.split?.(" ")?.[0] || userName || "Attendee";
  $: list = tab === "upcoming" ? upcoming : past;
  $: activeHighlight = tab === "past" ? pastHighlight : highlight;
  $: highlightVariant = tab === "past" ? "past" : "upcoming";
  $: emptyCopy =
    tab === "upcoming"
      ? "No upcoming tickets yet. Claim or buy a pass to see it here."
      : "No past tickets yet.";

  // Reset to first page when tab or list length changes
  $: tab, list.length, (pageIndex = 0);

  $: totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  $: if (pageIndex >= totalPages) pageIndex = Math.max(0, totalPages - 1);
  $: pageRows = list.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );
  $: rangeStart = list.length === 0 ? 0 : pageIndex * pageSize + 1;
  $: rangeEnd = Math.min((pageIndex + 1) * pageSize, list.length);
  $: showPager = list.length > pageSize;

  $: pageChips = (() => {
    const max = totalPages;
    if (max <= 5) return Array.from({ length: max }, (_, i) => i);
    let start = Math.max(0, pageIndex - 2);
    let end = Math.min(max - 1, start + 4);
    start = Math.max(0, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  function setTab(next) {
    onTabChange(next);
  }
</script>

<div class="flex w-full flex-col gap-5" data-node-id="604:1506">
  <header class="hidden flex-col gap-1 lg:flex">
    <h1 class="m-0 text-2xl font-extrabold tracking-[-0.5px] text-ink">
      Welcome Back, {displayName}
    </h1>
    <p class="m-0 text-sm text-ink-secondary">
      Your personalized Freetown event ticket dashboard. Scan at the gate or manage
      your passes.
    </p>
  </header>

  {#if activeHighlight}
    <MyTicketsHighlight
      ticket={activeHighlight}
      variant={highlightVariant}
      onShowQr={() => onShowQr(activeHighlight)}
      onAddToCalendar={() => onAddToCalendar(activeHighlight)}
      onViewTicket={() => onViewTicket(activeHighlight)}
      onFeedback={onFeedback}
    />
  {/if}

  <MyTicketsStats {stats} />

  <!-- Mobile segmented tabs (610:1374) -->
  <div
    class="flex w-full items-start lg:hidden"
    role="tablist"
    aria-label="Ticket filters"
  >
    <div
      class="flex flex-1 gap-1 rounded-full border border-paper-border bg-paper p-1"
    >
      <button
        type="button"
        role="tab"
        aria-selected={tab === "upcoming"}
        class="flex h-9 flex-1 cursor-pointer items-center justify-center rounded-full border-0 text-[13px] font-bold {tab ===
        'upcoming'
          ? 'bg-brand text-white'
          : 'bg-transparent text-ink-secondary'}"
        on:click={() => setTab("upcoming")}
      >
        Upcoming
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === "past"}
        class="flex h-9 flex-1 cursor-pointer items-center justify-center rounded-full border-0 text-[13px] font-bold {tab ===
        'past'
          ? 'bg-brand text-white'
          : 'bg-transparent text-ink-secondary'}"
        on:click={() => setTab("past")}
      >
        Past History
      </button>
    </div>
  </div>

  <!-- Desktop loose pills (604:1542) -->
  <div
    class="hidden items-center gap-2.5 lg:flex"
    role="tablist"
    aria-label="Ticket filters"
  >
    <button
      type="button"
      role="tab"
      aria-selected={tab === "upcoming"}
      class="cursor-pointer rounded-[20px] px-3.5 py-1.5 text-[13px] {tab ===
      'upcoming'
        ? 'border-0 bg-brand font-bold text-white'
        : 'border border-solid border-paper-border bg-transparent font-medium text-ink-secondary'}"
      on:click={() => setTab("upcoming")}
    >
      Upcoming
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={tab === "past"}
      class="cursor-pointer rounded-[20px] px-3.5 py-1.5 text-[13px] {tab === 'past'
        ? 'border-0 bg-brand font-bold text-white'
        : 'border border-solid border-paper-border bg-transparent font-medium text-ink-secondary'}"
      on:click={() => setTab("past")}
    >
      Past History
    </button>
  </div>

  <div class="flex w-full flex-col gap-4 lg:gap-3" role="tabpanel">
    {#if list.length === 0}
      <p
        class="m-0 rounded-2xl border border-dashed border-paper-border px-5 py-8 text-center text-sm text-ink-secondary"
      >
        {emptyCopy}
      </p>
    {:else}
      {#each pageRows as ticket (ticket.id)}
        <MyTicketsTicketRow
          {ticket}
          {tab}
          onShowQr={() => onShowQr(ticket)}
          onTransfer={() => onTransfer(ticket)}
          onDownload={() => onDownload(ticket)}
          onViewDetails={() => onViewDetails(ticket)}
        />
      {/each}

      {#if showPager}
        <div
          class="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="m-0 text-[13px] text-ink-secondary">
            Showing {rangeStart}–{rangeEnd} of {list.length} tickets
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="cursor-pointer rounded-lg border border-paper-border bg-paper px-3 py-2 text-[13px] font-semibold text-ink-secondary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={pageIndex === 0}
              on:click={() => (pageIndex = Math.max(0, pageIndex - 1))}
            >
              Previous
            </button>
            <div class="flex items-center gap-1">
              {#each pageChips as p}
                <button
                  type="button"
                  class="min-w-[36px] cursor-pointer rounded-lg px-3 py-2 text-[13px] {p ===
                  pageIndex
                    ? 'border-0 bg-brand font-bold text-white'
                    : 'border border-paper-border bg-paper font-semibold text-ink'}"
                  on:click={() => (pageIndex = p)}
                >
                  {p + 1}
                </button>
              {/each}
            </div>
            <button
              type="button"
              class="cursor-pointer rounded-lg px-3 py-2 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 {pageIndex >=
              totalPages - 1
                ? 'border border-paper-border bg-paper text-ink-secondary'
                : 'border-0 bg-brand text-white'}"
              disabled={pageIndex >= totalPages - 1}
              on:click={() =>
                (pageIndex = Math.min(totalPages - 1, pageIndex + 1))}
            >
              Next
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
