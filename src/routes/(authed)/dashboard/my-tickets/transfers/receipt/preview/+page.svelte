<script>
  // @ts-nocheck
  /**
   * Transfer result preview with sample data (dev only): Transfer Successful (527:343) and
   * Transfer Failed (527:546, `?status=failed`), HI-FI desktop. Mobile Transfer Successful 311:265, Transfer Failed 313:83.
   */
  import TransferResultHero from "$lib/components/attendee/TransferResultHero.svelte";
  import TransferReceiptCard from "$lib/components/attendee/TransferReceiptCard.svelte";

  export let data;

  $: receipt = data?.receipt || null;
  $: status = data?.status || "success";
</script>

<svelte:head>
  <title>{status === "failed" ? "Transfer Failed" : "Transfer Successful"} | SOS SEATS</title>
</svelte:head>

<div
  class="flex w-full flex-col items-center md:pt-0 lg:gap-5 {status === 'failed'
    ? 'gap-6 pt-3'
    : 'gap-6 pb-1.5 pt-6 md:pb-0'}"
>
  <TransferResultHero variant={status} />
  <TransferReceiptCard {receipt} variant={status} />
</div>
