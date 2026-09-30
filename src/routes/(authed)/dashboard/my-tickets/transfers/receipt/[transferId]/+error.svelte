<script>
  // @ts-nocheck
  /** Transfer receipt error, rendered inside AttendeeShell (no root +error.svelte in the app). */
  import { page } from "$app/stores";
  import TransferErrorState from "$lib/components/attendee/TransferErrorState.svelte";

  $: notFound = $page.status === 404;
</script>

<svelte:head>
  <title>Transfer Receipt | SOS SEATS</title>
</svelte:head>

<TransferErrorState
  message={notFound ? "Transfer receipt not found" : "Something went wrong"}
  hint={notFound
    ? "Receipts are only available to the person who sent the ticket."
    : "Please try again in a moment."}
/>
