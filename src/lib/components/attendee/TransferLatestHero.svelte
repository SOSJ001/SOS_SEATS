<script>
  // @ts-nocheck
  /**
   * "Most Recent Transfer" hero: desktop 606:1343, mobile 311:174.
   * Rendered twice by the layout (mobile top, desktop inside All Transfers), so the mapping lives here.
   */
  import TransferHero from "./TransferHero.svelte";
  import TransferStatusBadge from "./TransferStatusBadge.svelte";

  export let entry = null;
  /** @type {(entry: any) => void} */
  export let onViewReceipt = () => {};

  $: isPending = entry?.status === "PENDING";
  $: meta = entry
    ? [
        entry.tierLabel,
        entry.recipientUsername ? `Transferred to ${entry.recipientUsername}` : "",
        entry.transferredAtLabel,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
</script>

{#if entry}
  <TransferHero
    eyebrow="Most Recent Transfer"
    title={entry.eventName}
    {meta}
    image={entry.eventImage}
    primaryLabel={isPending ? "Transfer Pending" : "View Transfer Receipt"}
    primaryDisabled={isPending}
    onPrimary={() => onViewReceipt(entry)}
    secondaryLabel={entry.recipientUsername ? `@${entry.recipientUsername}` : ""}
  >
    <TransferStatusBadge slot="badge" status={entry.status} size="md" pill />
  </TransferHero>
{/if}
