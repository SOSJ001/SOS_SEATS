<script>
  // @ts-nocheck
  /**
   * Transfer Ticket form: desktop TransferCard 609:1364 (dense per hifi-density), mobile 36:905.
   * Mobile order: header card, input, ticket, warning, guidance, CTA. Desktop: ticket before input.
   * Ticket card is TicketLivePreview 571:110 without qrData (FR-20) and with a masked number.
   */
  import TicketIcon from "lucide-svelte/icons/ticket";
  import AtSign from "lucide-svelte/icons/at-sign";
  import TicketLivePreview from "$lib/components/organizer/TicketLivePreview.svelte";
  import TransferWarning from "./TransferWarning.svelte";
  import TransferGuidelines from "./TransferGuidelines.svelte";
  import { ticketPreviewLayout, maskTicketNumber } from "$lib/client/ticketLayout";
  import { showToast } from "$lib/store";

  /** @type {any} */
  export let ticket;

  let recipient = "";
  let error = "";
  let submitting = false;

  $: canSubmit = !!recipient.trim() && !submitting;
  $: layout = ticketPreviewLayout(ticket?.ticketDesignConfig);
  $: ticketTypes = [{ name: ticket?.ticketTypeName || "Ticket" }];
  $: maskedNumber = maskTicketNumber(ticket?.qrPayload);

  async function submit() {
    if (!canSubmit) return;
    submitting = true;
    error = "";
    try {
      const res = await fetch("/api/tickets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, recipient }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.success) {
        error = body?.error || "Could not check that username";
        return;
      }
      showToast(
        "info",
        "Transfer coming next",
        `@${body.recipient} can receive this ticket. Sending lands with the transfer backend (roadmap 6.2b).`
      );
    } catch {
      showToast(
        "error",
        "Could not reach SOS SEATS",
        "Check your connection and try again."
      );
    } finally {
      submitting = false;
    }
  }
</script>

<form
  class="flex w-full flex-col gap-3 lg:mx-auto lg:max-w-[640px] lg:rounded-2xl lg:border lg:border-paper-border lg:bg-gradient-to-r lg:from-paper lg:to-brand-soft lg:p-4 lg:shadow-[0_8px_12px_rgba(18,4,28,0.04)]"
  novalidate
  on:submit|preventDefault={submit}
>
  <div
    class="order-1 flex flex-col gap-2 rounded-2xl border border-paper-border bg-gradient-to-r from-brand-soft to-[#fffbf5] p-3 shadow-[0_8px_12px_rgba(18,4,28,0.04)] lg:rounded-none lg:border-0 lg:bg-none lg:p-0 lg:shadow-none"
  >
    <div class="flex items-center gap-2.5 lg:gap-3">
      <span
        class="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/[0.07] text-brand lg:size-8"
        aria-hidden="true"
      >
        <TicketIcon size={16} strokeWidth={3} />
      </span>
      <h2 class="m-0 flex-1 text-lg font-extrabold text-ink lg:text-2xl">Transfer Ticket</h2>
    </div>
    <p class="m-0 text-[13px] leading-[18px] text-ink-secondary lg:text-[15px] lg:leading-[22px]">
      Transfer custody of your digital ticket to another user. The recipient's username account
      receives the fresh ticket and QR in My Tickets.
    </p>
  </div>

  <div class="order-3 w-full lg:order-2">
    <TicketLivePreview
      {layout}
      eventName={ticket?.eventName || ""}
      eventDate={ticket?.eventDate || ""}
      eventTime={ticket?.eventTime || ""}
      eventLocation={ticket?.eventLocation || ""}
      {ticketTypes}
      ticketNumber={maskedNumber}
    />
  </div>

  <div class="order-2 flex w-full flex-col gap-1.5 lg:order-3 lg:gap-2">
    <label
      for="transfer-recipient"
      class="text-xs font-bold uppercase text-ink-secondary lg:font-semibold lg:normal-case lg:text-ink"
    >
      Recipient username
    </label>
    <div
      class="flex h-11 w-full items-center gap-3 rounded-lg border bg-paper px-4 focus-within:border-brand lg:h-10 {error
        ? 'border-red-500'
        : 'border-paper-border'}"
    >
      <AtSign size={18} class="hidden shrink-0 text-ink-muted lg:block" aria-hidden="true" />
      <input
        id="transfer-recipient"
        name="recipient"
        type="text"
        bind:value={recipient}
        on:input={() => (error = "")}
        autocomplete="off"
        autocapitalize="none"
        spellcheck="false"
        placeholder="Enter recipient username"
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? "transfer-recipient-error" : undefined}
        class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-0"
      />
    </div>
    {#if error}
      <p id="transfer-recipient-error" class="m-0 text-xs font-semibold text-red-600" role="alert">
        {error}
      </p>
    {/if}
  </div>

  <div class="order-4 hidden h-px w-full bg-paper-border lg:block" aria-hidden="true"></div>

  <div class="order-5 w-full">
    <TransferWarning variant="form" />
  </div>

  <div class="order-6 w-full lg:hidden">
    <TransferGuidelines variant="compact" />
  </div>

  <div class="order-7 flex w-full flex-col gap-3">
    <button
      type="submit"
      disabled={!canSubmit}
      class="flex h-12 w-full items-center justify-center rounded-lg border-0 bg-brand text-[15px] font-bold text-white enabled:cursor-pointer enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 lg:h-10 lg:text-[13px]"
    >
      {#if submitting}
        Checking...
      {:else}
        <span class="lg:hidden">Confirm &amp; Transfer Ticket</span>
        <span class="hidden lg:inline">Confirm &amp; Transfer</span>
      {/if}
    </button>
    <p class="m-0 hidden text-xs font-semibold text-ink-muted lg:block">Powered by SOS SEATS</p>
  </div>
</form>
