<script>
  // @ts-nocheck
  /** Scanner route error, rendered inside DoorShell. */
  import { page } from "$app/stores";
  import ArrowLeft from "lucide-svelte/icons/arrow-left";

  $: notFound = $page.status === 404;
</script>

<svelte:head>
  <title>Door Scanner | SOS SEATS</title>
</svelte:head>

<div
  class="mx-auto mt-8 flex w-full max-w-[640px] flex-col items-center gap-3 rounded-2xl border border-dashed border-paper-border bg-paper px-5 py-8 text-center"
>
  <p class="m-0 text-base font-bold text-ink">
    {notFound ? $page.error?.message || "Event not found" : "Something went wrong"}
  </p>
  <p class="m-0 text-sm text-ink-secondary">
    {notFound
      ? "You can only scan tickets for events you own."
      : "Please try again in a moment."}
  </p>
  <a
    href="/dashboard/scanner"
    class="inline-flex items-center gap-1.5 text-sm font-semibold text-brand underline hover:opacity-90"
  >
    <ArrowLeft class="size-4" aria-hidden="true" />
    Back to Door events
  </a>
</div>
