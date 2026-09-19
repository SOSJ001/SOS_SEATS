<script>
  // @ts-nocheck
  export let backLabel = "Back";
  export let nextLabel = "Next";
  export let onBack = () => {};
  export let onNext = () => {};
  export let nextDisabled = false;
  export let nextLoading = false;
</script>

<div
  class="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-paper-border pt-6 sm:flex-row sm:items-center"
>
  <button
    type="button"
    on:click={onBack}
    class="rounded-lg border border-paper-border bg-white px-6 py-3 text-sm font-bold text-ink-secondary transition hover:bg-paper-cream"
  >
    {backLabel}
  </button>
  <button
    type="button"
    on:click={onNext}
    disabled={nextDisabled || nextLoading}
    class="rounded-lg bg-brand px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {nextLoading ? "Please wait…" : nextLabel}
  </button>
</div>
