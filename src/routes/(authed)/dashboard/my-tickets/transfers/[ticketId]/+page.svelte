<script>
  // @ts-nocheck
  /**
   * Transfer Ticket form: desktop HI-FI 55:708 / mobile 36:890 (roadmap 6.2 / FR-21).
   * Mobile: Back sub-header, no hero, compact guidance inside the form.
   * Confirm checks the recipient only; the transfer itself is roadmap 6.2b.
   */
  import ArrowLeft from "lucide-svelte/icons/arrow-left";
  import TransferHero from "$lib/components/attendee/TransferHero.svelte";
  import TransferForm from "$lib/components/attendee/TransferForm.svelte";
  import TransferGuidelines from "$lib/components/attendee/TransferGuidelines.svelte";

  export let data;

  $: ticket = data?.ticket;
</script>

<svelte:head>
  <title>Transfer Ticket | SOS SEATS</title>
</svelte:head>

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
    <TransferForm {ticket} />
  </div>

  <div class="hidden w-full lg:block">
    <TransferGuidelines variant="card" />
  </div>
</div>
