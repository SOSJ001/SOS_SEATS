<script>
  // @ts-nocheck
  /** Transfer form error, rendered inside AttendeeShell (no root +error.svelte in the app). */
  import { page } from "$app/stores";
  import TransferErrorState from "$lib/components/attendee/TransferErrorState.svelte";

  $: notFound = $page.status === 404;
</script>

<svelte:head>
  <title>Transfer Ticket | SOS SEATS</title>
</svelte:head>

<TransferErrorState
  message={notFound
    ? $page.error?.message || "This ticket can't be transferred"
    : "Something went wrong"}
  hint={notFound
    ? "Only valid tickets for upcoming events can be transferred."
    : "Please try again in a moment."}
/>
