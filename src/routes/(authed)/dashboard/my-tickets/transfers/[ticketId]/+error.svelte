<script>
  // @ts-nocheck
  /** Transfer form error, rendered inside AttendeeShell (no root +error.svelte in the app). */
  import { page } from "$app/stores";

  $: notFound = $page.status === 404;
  $: message = notFound
    ? $page.error?.message || "This ticket can't be transferred"
    : "Something went wrong";
</script>

<svelte:head>
  <title>Transfer Ticket | SOS SEATS</title>
</svelte:head>

<div
  class="mx-auto flex w-full max-w-[640px] flex-col items-center gap-3 rounded-2xl border border-dashed border-paper-border px-5 py-8 text-center"
>
  <p class="m-0 text-base font-bold text-ink">{message}</p>
  <p class="m-0 text-sm text-ink-secondary">
    {notFound
      ? "Only valid tickets for upcoming events can be transferred."
      : "Please try again in a moment."}
  </p>
  <a
    href="/dashboard/my-tickets/transfers"
    class="text-sm font-semibold text-brand underline hover:opacity-90"
  >
    Back to Transfers
  </a>
</div>
