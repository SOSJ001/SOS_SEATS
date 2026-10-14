<script lang="ts">
  const tips = [
    "Withdrawals are processed in local currency (NLe).",
    "Double-check the recipient wallet number before confirming.",
    "You'll see the fee and the exact amount you receive before you confirm.",
  ];
</script>

<div
  class="flex flex-col gap-3 rounded-2xl border border-solid border-paper-border bg-paper-cream p-4"
>
  <h2 class="m-0 text-base font-extrabold leading-normal text-ink">Helpful tips</h2>
  <ul class="m-0 flex list-none flex-col gap-2 p-0">
    {#each tips as tip}
      <li class="flex items-center gap-2.5 text-[13px] leading-normal text-ink-secondary">
        <span class="size-2 shrink-0 rounded-full bg-brand" aria-hidden="true"></span>
        <span class="min-w-0 flex-1">{tip}</span>
      </li>
    {/each}
  </ul>
</div>
