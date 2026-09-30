<script>
  // @ts-nocheck
  /** Transfer route error card, rendered inside AttendeeShell (no root +error.svelte in the app). */
  export let message = "Something went wrong";
  export let hint = "Please try again in a moment.";
</script>

<div
  class="mx-auto flex w-full max-w-[640px] flex-col items-center gap-3 rounded-2xl border border-dashed border-paper-border px-5 py-8 text-center"
>
  <p class="m-0 text-base font-bold text-ink">{message}</p>
  <p class="m-0 text-sm text-ink-secondary">{hint}</p>
  <a
    href="/dashboard/my-tickets/transfers"
    class="text-sm font-semibold text-brand underline hover:opacity-90"
  >
    Back to Transfers
  </a>
</div>
