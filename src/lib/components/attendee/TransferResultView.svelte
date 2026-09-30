<script>
  // @ts-nocheck
  /**
   * Transfer result: Transfer Successful (527:343, mobile 311:265) and Transfer Failed
   * (527:546, mobile 313:83). Used by the real receipt, the form's failed state and the dev preview.
   */
  import TransferResultHero from "./TransferResultHero.svelte";
  import TransferReceiptCard from "./TransferReceiptCard.svelte";

  /** @type {Record<string, any> | null} */
  export let receipt = null;
  /** @type {"success" | "failed"} */
  export let variant = "success";
  /** @type {(() => void) | null} */
  export let onTryAgain = null;
</script>

<div
  class="flex w-full flex-col items-center md:pt-0 lg:gap-5 {variant === 'failed'
    ? 'gap-6 pt-3'
    : 'gap-6 pb-1.5 pt-6 md:pb-0'}"
>
  <TransferResultHero {variant} />
  <TransferReceiptCard {receipt} {variant} {onTryAgain} />
</div>
