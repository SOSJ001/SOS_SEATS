<script>
  import { LEGAL } from "$lib/legal/legalConfig.js";

  /** @type {"creating an account" | "paying" | "claiming" | "publishing"} */
  export let action = "paying";
  /** Text colour class, so the note can match the surrounding copy. */
  export let tone = "text-ink-secondary";
  /** Extra classes for spacing/alignment at the call site. */
  let className = "";
  export { className as class };

  $: refundLine =
    action === "paying" || action === "claiming"
      ? "Refunds are handled by the event organiser, not SOS SEATS."
      : action === "publishing"
        ? "You are responsible for refunds for your event."
        : "";
</script>

<p class="m-0 text-xs leading-[18px] {tone} {className}">
  By {action}, you agree to the
  <a href="/terms" class="font-semibold text-brand no-underline hover:underline">Terms</a>
  and
  <a href="/privacy" class="font-semibold text-brand no-underline hover:underline">Privacy Policy</a
  >.{#if action === "creating an account"}&nbsp;You confirm you are {LEGAL.minAge} or older.{/if}
  {#if refundLine}{refundLine}{/if}
</p>
