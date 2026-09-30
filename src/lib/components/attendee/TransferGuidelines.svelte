<script>
  // @ts-nocheck
  /**
   * Transfer guidelines.
   * card: desktop GuidelinesCard 609:1380 (dense per hifi-density).
   * compact: mobile "Transfer Guidance" checklist 1352:2151 (36:890).
   */
  import Check from "lucide-svelte/icons/check";

  /** @type {"card" | "compact"} */
  export let variant = "card";

  const items = [
    {
      title: "Instant Delivery",
      body: "The recipient's username account receives the fresh ticket and QR in My Tickets.",
      short: "Fresh QR in My Tickets",
    },
    {
      title: "Permanent Transfer",
      body: "Once the transfer is submitted, it is permanent and cannot be reversed. The original QR code is deactivated immediately.",
      short: "Original QR deactivated",
    },
    {
      title: "Active Accounts Required",
      body: "Both the sender and recipient must have active SOS SEATS accounts to complete the transfer.",
      short: "Active accounts required",
    },
  ];
</script>

{#if variant === "compact"}
  <div class="flex w-full flex-col gap-3">
    <div class="flex w-full items-center gap-2">
      <span class="size-3 shrink-0 rounded-full bg-amber-500" aria-hidden="true"></span>
      <p class="m-0 flex-1 text-sm font-bold leading-[18px] text-[#1f2937]">Transfer Guidance</p>
    </div>
    <ul class="m-0 flex list-none flex-col gap-2 p-0">
      {#each items as item (item.title)}
        <li class="flex w-full items-start gap-2.5">
          <span class="flex size-4 shrink-0 items-center justify-center text-amber-500" aria-hidden="true">
            <Check size={14} strokeWidth={3.4} />
          </span>
          <span class="flex-1 text-[13px] leading-4 text-slate-600">{item.short}</span>
        </li>
      {/each}
    </ul>
  </div>
{:else}
  <section
    class="mx-auto flex w-full max-w-[640px] flex-col gap-3 rounded-2xl border border-paper-border bg-paper p-4"
    aria-labelledby="transfer-guidelines-title"
  >
    <div class="flex flex-col gap-1">
      <h2 id="transfer-guidelines-title" class="m-0 text-xl font-extrabold text-ink">
        Transfer Guidelines
      </h2>
      <p class="m-0 text-xs text-ink-secondary">How ticket transfers work on SOS SEATS.</p>
    </div>
    <ul class="m-0 flex list-none flex-col gap-3 p-0">
      {#each items as item (item.title)}
        <li
          class="flex w-full items-center gap-3 rounded-xl border border-paper-border bg-brand-soft p-3"
        >
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/[0.07] text-brand"
            aria-hidden="true"
          >
            <Check size={20} />
          </span>
          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="text-[15px] font-extrabold text-ink">{item.title}</span>
            <span class="text-sm leading-5 text-ink-secondary">{item.body}</span>
          </span>
        </li>
      {/each}
    </ul>
  </section>
{/if}
