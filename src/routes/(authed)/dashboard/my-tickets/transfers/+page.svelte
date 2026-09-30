<script>
  // @ts-nocheck
  /**
   * Ticket Transfers: desktop HI-FI 604:1579 / mobile 306:76, history 606:1343 / 311:174 (roadmap 6.2 / FR-21).
   * Transfer buttons open the form at [ticketId]; receipts land with the 6.2b transfer backend.
   */
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { showToast } from "$lib/store";
  import TransfersLayout from "$lib/components/attendee/TransfersLayout.svelte";

  export let data;

  $: tab = $page.url.searchParams.get("tab") === "history" ? "history" : "new";

  function setTab(next) {
    const opts = { replaceState: true, noScroll: true, keepFocus: true };
    if (next === "history") goto("?tab=history", opts);
    else goto($page.url.pathname, opts);
  }

  function startTransfer(ticket) {
    if (!ticket?.id) return;
    goto(`/dashboard/my-tickets/transfers/${ticket.id}`);
  }

  function viewReceipt() {
    showToast(
      "info",
      "Transfer receipt coming next",
      "Receipts arrive with the transfer backend (roadmap 6.2b)."
    );
  }
</script>

<svelte:head>
  <title>Ticket Transfers | SOS SEATS</title>
</svelte:head>

<TransfersLayout
  tickets={data?.tickets || []}
  next={data?.next || null}
  stats={data?.stats || { total: 0, completed: 0 }}
  history={data?.history || []}
  {tab}
  onTabChange={setTab}
  onTransfer={startTransfer}
  onViewReceipt={viewReceipt}
/>
