<script>
  // @ts-nocheck
  /**
   * Transfer result preview with sample data (dev only): Transfer Successful (527:343) and
   * Transfer Failed (527:546, `?status=failed`), HI-FI desktop. Mobile Transfer Successful 311:265, Transfer Failed 313:83.
   */
  import TransferResultView from "$lib/components/attendee/TransferResultView.svelte";

  export let data;

  $: receipt = data?.receipt || null;
  $: status = data?.status || "success";
</script>

<svelte:head>
  <title>{status === "failed" ? "Transfer Failed" : "Transfer Successful"} | SOS SEATS</title>
</svelte:head>

<TransferResultView {receipt} variant={status} />
