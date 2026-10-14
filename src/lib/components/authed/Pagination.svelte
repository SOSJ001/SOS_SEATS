<script lang="ts">
  /** Previous / page numbers / Next bar, as on the Guests tab. */
  export let page = 0;
  export let pageSize = 10;
  export let total = 0;
  /** Plural noun for the "Showing x of y" line, e.g. "guests". */
  export let label = "items";
  let className = "";
  export { className as class };

  $: totalPages = Math.max(1, Math.ceil(total / pageSize));
  $: if (page >= totalPages) page = totalPages - 1;
  $: if (page < 0) page = 0;
  $: from = total === 0 ? 0 : page * pageSize + 1;
  $: to = Math.min((page + 1) * pageSize, total);

  /** Up to 5 page numbers centred on the current page. */
  $: chips = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i);
    let start = Math.max(0, page - 2);
    let end = start + 5;
    if (end > totalPages) {
      end = totalPages;
      start = totalPages - 5;
    }
    return Array.from({ length: end - start }, (_, i) => start + i);
  })();
</script>

<div class="flex flex-wrap items-center justify-between gap-3 {className}">
  <p class="m-0 text-[13px] text-ink-secondary">
    Showing {from}–{to} of {total} {label}
  </p>
  <div class="flex flex-wrap items-center gap-2">
    <button
      type="button"
      class="cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#64748b] disabled:cursor-default disabled:opacity-40"
      disabled={page === 0}
      on:click={() => (page = Math.max(0, page - 1))}
    >
      Previous
    </button>
    <div class="flex items-center gap-1">
      {#each chips as p}
        <button
          type="button"
          class="min-w-[36px] cursor-pointer rounded-lg px-3 py-2 text-[13px]
            {p === page
            ? 'border-0 bg-brand font-bold text-white'
            : 'border border-[#e2e8f0] bg-white font-semibold text-ink'}"
          aria-current={p === page ? "page" : undefined}
          on:click={() => (page = p)}
        >
          {p + 1}
        </button>
      {/each}
    </div>
    <button
      type="button"
      class="cursor-pointer rounded-lg px-3.5 py-2 text-[13px] font-semibold disabled:cursor-default disabled:opacity-40
        {page >= totalPages - 1
        ? 'border border-[#e2e8f0] bg-white text-[#64748b]'
        : 'border-0 bg-brand text-white'}"
      disabled={page >= totalPages - 1}
      on:click={() => (page = Math.min(totalPages - 1, page + 1))}
    >
      Next
    </button>
  </div>
</div>
