<script>
  // @ts-nocheck
  import Wallet from "lucide-svelte/icons/wallet";

  export let initials = "";
  export let name = "";
  /** Shown before the name, e.g. "Hi". */
  export let greeting = "";
  export let walletLabel = "";
  /** @type {string | null} */
  export let walletAddress = "";
  /** Role pill, e.g. "ORGANISER". */
  export let badge = "";
</script>

<div class="flex items-center gap-3">
  <div
    class="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#fff5f1] text-base font-extrabold text-brand"
  >
    {initials}
  </div>
  <div class="min-w-0">
    <p class="m-0 truncate text-sm font-bold text-ink">{greeting ? `${greeting} ${name}` : name}</p>
    {#if walletLabel}
      <p
        class="m-0 mt-1 flex items-center gap-1 truncate text-[11px] text-ink-secondary"
        title={walletAddress}
      >
        <Wallet class="size-3 shrink-0 opacity-80" aria-hidden="true" />
        <span>Linked wallet · {walletLabel}</span>
      </p>
    {/if}
    {#if badge}
      <span
        class="mt-1 inline-flex rounded-full bg-brand px-1.5 py-0.5 text-[8px] font-extrabold tracking-wide text-white"
      >
        {badge}
      </span>
    {/if}
  </div>
</div>
