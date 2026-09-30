<script>
  // @ts-nocheck
  /** Transfer receipt (roadmap 6.2b / FR-21e): Transfer Successful 527:343, mobile 311:265. */
  import TransferResultView from "$lib/components/attendee/TransferResultView.svelte";

  export let data;
</script>

<svelte:head>
  <title>Transfer Successful | SOS SEATS</title>
</svelte:head>

<TransferResultView receipt={data?.receipt || null} variant="success" />
