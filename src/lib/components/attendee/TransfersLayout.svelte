<script>
  // @ts-nocheck
  /**
   * Ticket Transfers layout: desktop 604:1595 / mobile 306:76, history 606:1343 / 311:174 (shell owns chrome).
   * Mobile HI-FI below lg; desktop at lg with hifi-density (same split as My Tickets).
   */
  import TransferHero from "./TransferHero.svelte";
  import TransferLatestHero from "./TransferLatestHero.svelte";
  import TransferStats from "./TransferStats.svelte";
  import AttendeeTabs from "./AttendeeTabs.svelte";
  import TransferWarning from "./TransferWarning.svelte";
  import TransferTicketCard from "./TransferTicketCard.svelte";
  import TransfersRecent from "./TransfersRecent.svelte";
  import TransfersHistory from "./TransfersHistory.svelte";

  /** @type {any[]} */
  export let tickets = [];
  /** @type {any} */
  export let next = null;
  /** @type {{ total: number; completed: number }} */
  export let stats = { total: 0, completed: 0 };
  /** All transfers, newest first. @type {any[]} */
  export let history = [];
  /** @type {"new" | "history"} */
  export let tab = "new";
  /** @type {(next: "new" | "history") => void} */
  export let onTabChange = () => {};
  /** @type {(ticket: any) => void} */
  export let onTransfer = () => {};
  /** @type {(entry: any) => void} */
  export let onViewReceipt = () => {};

  const tabs = [
    { id: "new", label: "New Transfer" },
    { id: "history", label: "Transfer History" },
  ];

  $: eligibleLabel = `${tickets.length} eligible ticket${tickets.length === 1 ? "" : "s"}`;
  $: latest = history[0] ?? null;
  $: recent = history.slice(0, 3);
</script>

<div class="flex w-full flex-col gap-3 lg:gap-5" data-node-id="604:1595">
  <header class="hidden flex-col gap-1 lg:flex">
    <h1 class="m-0 text-2xl font-extrabold tracking-[-0.5px] text-ink">Ticket Transfers</h1>
    <p class="m-0 text-sm text-ink-secondary">
      Securely send passes to friends or family. Instantly deactivates your old QR and issues
      them a new one.
    </p>
  </header>

  {#if tab === "new" && next}
    <TransferHero
      eyebrow="Your Next Transfer"
      title={next.eventName}
      meta={next.metaLine}
      image={next.eventImage}
      primaryLabel="Transfer Now"
      onPrimary={() => onTransfer(next)}
      secondaryLabel="View Event Details"
      secondaryHref="/marketplace/eventDetails/{next.eventId}"
    >
      <span
        slot="badge"
        class="inline-flex w-fit rounded-[30px] bg-[#fff0ea] px-3 py-1.5 text-[13px] font-extrabold leading-4 text-brand"
      >
        READY
      </span>
    </TransferHero>
  {:else if tab === "history" && latest}
    <div class="w-full lg:hidden">
      <TransferLatestHero entry={latest} {onViewReceipt} />
    </div>
  {/if}

  <TransferStats
    {stats}
    totalSub={tab === "history" ? "All time transfers" : "Pending & completed"}
  />

  <AttendeeTabs
    {tabs}
    active={tab}
    onChange={onTabChange}
    ariaLabel="Transfer views"
  />

  {#if tab === "history"}
    <TransfersHistory entries={history} {onViewReceipt} />
  {:else}
    <TransferWarning />

    <section class="flex w-full flex-col gap-4 lg:gap-3" data-node-id="604:1620">
      <div class="hidden w-full flex-col gap-2 lg:flex">
        <div class="flex w-full items-center justify-between gap-3">
          <h2 class="m-0 text-xl font-extrabold text-ink">Select a ticket to transfer</h2>
          {#if tickets.length > 0}
            <span
              class="rounded-full border border-[#ffe9d2] bg-[#fff4ed] px-2.5 py-1 text-xs font-extrabold text-brand"
            >
              {eligibleLabel}
            </span>
          {/if}
        </div>
        <p class="m-0 text-sm font-semibold text-ink-secondary">
          Only valid, unused tickets are eligible. Choose one to continue.
        </p>
      </div>
      {#if tickets.length === 0}
        <p
          class="m-0 rounded-2xl border border-dashed border-paper-border px-5 py-8 text-center text-sm text-ink-secondary"
        >
          No transferable tickets. Only valid tickets for upcoming events can be transferred.
          <a href="/marketplace" class="font-semibold text-brand underline">Browse events</a>
        </p>
      {:else}
        <div class="grid w-full gap-4 lg:grid-cols-2">
          {#each tickets as ticket (ticket.id)}
            <TransferTicketCard {ticket} onTransfer={() => onTransfer(ticket)} />
          {/each}
        </div>
      {/if}
    </section>

    <div class="hidden w-full lg:block">
      <TransfersRecent entries={recent} {onViewReceipt} />
    </div>
  {/if}
</div>
