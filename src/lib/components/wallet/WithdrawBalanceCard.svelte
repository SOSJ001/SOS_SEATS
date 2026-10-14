<script lang="ts">
  import { formatNle } from "$lib/client/walletFormat";

  /** null while loading or when the summary could not be loaded */
  export let available: number | null = null;
</script>

<div
  class="flex flex-col gap-2 rounded-xl border border-paper-border bg-paper p-5 leading-normal lg:rounded-2xl lg:bg-paper-cream lg:p-5"
>
  <p
    class="m-0 text-[13px] text-ink-secondary lg:text-xs lg:font-bold lg:uppercase lg:tracking-[2px]"
  >
    Available Balance
  </p>
  <p
    class="m-0 font-display text-[32px] font-bold text-slate-public lg:font-public lg:text-3xl lg:font-extrabold lg:text-ink"
  >
    {available === null ? "--" : formatNle(available)}
  </p>
</div>
