<script>
  // @ts-nocheck
  /**
   * Transfer Ticket form: desktop HI-FI 55:708 / mobile 36:890 (roadmap 6.2 / 6.2b, FR-21).
   * Mobile: Back sub-header, no hero, compact guidance inside the form.
   * Success goes to the receipt; a rule failure swaps the page for Transfer Failed (FR-21d).
   */
  import ArrowLeft from "lucide-svelte/icons/arrow-left";
  import TransferHero from "$lib/components/attendee/TransferHero.svelte";
  import TransferForm from "$lib/components/attendee/TransferForm.svelte";
  import TransferGuidelines from "$lib/components/attendee/TransferGuidelines.svelte";
  import TransferResultView from "$lib/components/attendee/TransferResultView.svelte";

  export let data;

  /** @type {{ reason: string, recipient: string } | null} */
  let failure = null;

  $: ticket = data?.ticket;
  $: failedReceipt = failure
    ? {
        ...data?.receiptBase,
        recipientUsername: failure.recipient,
        failureReason: failure.reason,
        ticketId: ticket?.id,
      }
    : null;

  function onFailed(detail) {
    failure = detail;
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  function tryAgain() {
    failure = null;
  }
</script>

<svelte:head>
  <title>{failure ? "Transfer Failed" : "Transfer Ticket"} | SOS SEATS</title>
</svelte:head>

{#if failure}
  <TransferResultView receipt={failedReceipt} variant="failed" onTryAgain={tryAgain} />
{:else}
  <div class="flex w-full flex-col gap-2 lg:gap-5">
    <div
      class="-mx-5 flex w-[calc(100%+2.5rem)] items-center justify-between border-b border-paper-border bg-paper px-5 py-3 md:-mx-20 md:-mt-8 md:w-[calc(100%+10rem)] md:px-20 lg:hidden"
    >
      <a
        href="/dashboard/my-tickets/transfers"
        class="flex items-center gap-1 text-base font-bold leading-5 text-brand no-underline hover:opacity-90"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Back
      </a>
      <h1 class="m-0 text-lg font-extrabold leading-tight text-ink">Transfer Ticket</h1>
      <span class="invisible flex items-center gap-1 text-base font-bold leading-5" aria-hidden="true">
        <ArrowLeft size={18} />
        Back
      </span>
    </div>

    <div class="hidden w-full lg:block">
      <TransferHero
        eyebrow="Ticket Being Transferred"
        title={ticket?.eventName}
        meta={ticket?.metaLine}
        image={ticket?.eventImage}
        primaryLabel="View Ticket Details"
        primaryHref="/marketplace/eventDetails/{ticket?.eventId}"
      />
    </div>

    <div class="-mx-1 md:mx-0">
      <TransferForm {ticket} {onFailed} />
    </div>

    <div class="hidden w-full lg:block">
      <TransferGuidelines variant="card" />
    </div>
  </div>
{/if}
