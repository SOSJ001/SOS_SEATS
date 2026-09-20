<script>
  // @ts-nocheck
  /** Confirm Ticket Issue — desktop HI-FI 527:722 / mobile HI-FI 389:83. */
  import { goto } from "$app/navigation";
  import Info from "lucide-svelte/icons/info";
  import Ticket from "lucide-svelte/icons/ticket";
  import Wallet from "lucide-svelte/icons/wallet";
  import TriangleAlert from "lucide-svelte/icons/triangle-alert";
  import AuthPanelDecor from "$lib/components/auth/AuthPanelDecor.svelte";
  import CheckoutEventHero from "$lib/components/checkout/CheckoutEventHero.svelte";
  import { showToast } from "$lib/store";

  export let data;

  $: event = data.event;
  $: error = data.error;
  $: qty = data.qty || 1;
  $: feeEach = data.feeEach || 0.99;
  $: feeTotal = data.feeTotal || qty * feeEach;
  $: walletBalance = data.walletBalance ?? 0;

  let submitting = false;

  function formatNle(n) {
    return Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async function confirmIssue() {
    if (!event?.id || submitting) return;
    submitting = true;
    try {
      const res = await fetch(`/api/events/${event.id}/private-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty, method: "wallet" }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        showToast(
          "error",
          "Issue failed",
          body.error || "Could not generate tickets."
        );
        return;
      }
      goto(
        `/dashboard/events/eventDetails/issue-success?id=${event.id}&qty=${body.qty || qty}`
      );
    } catch {
      showToast("error", "Issue failed", "Please try again.");
    } finally {
      submitting = false;
    }
  }
</script>

{#if error || !event}
  <div class="flex min-h-screen items-center justify-center bg-paper p-8">
    <div class="max-w-md rounded-2xl border border-paper-border bg-white p-8 text-center">
      <h1 class="m-0 text-xl font-bold text-ink">Confirm unavailable</h1>
      <p class="mt-2 text-sm text-ink-secondary">{error || "Missing event."}</p>
      <a
        href="/dashboard/events"
        class="mt-6 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white no-underline"
      >
        Back to Events
      </a>
    </div>
  </div>
{:else}
  <div class="flex min-h-screen flex-col lg:flex-row">
    <CheckoutEventHero
      badge="CONFIRM ISSUE"
      title={event.title}
      date={event.date}
      location={event.location}
      image={event.image}
      ticketLabel={`${qty} ticket${qty === 1 ? "" : "s"}`}
    />

    <div
      class="relative flex flex-1 items-start justify-center overflow-hidden bg-paper px-5 pb-6 pt-3 lg:w-1/2 lg:items-center lg:px-8 lg:py-6"
    >
      <div class="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
        <AuthPanelDecor />
      </div>
      <div
        class="relative z-10 flex w-full max-w-[440px] flex-col gap-4 lg:gap-3"
      >
        <div class="flex flex-col gap-3 lg:gap-2">
          <div class="flex items-center gap-4 lg:items-start lg:gap-2.5">
            <span
              class="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-[#ed6b2d] bg-[#fff4ed] text-brand lg:size-8 lg:border-0 lg:bg-[#fff1eb]"
            >
              <Info size={24} class="lg:hidden" />
              <Info size={16} class="hidden lg:block" />
            </span>
            <div class="min-w-0 flex-1">
              <h2
                class="m-0 text-2xl font-extrabold text-ink lg:text-lg"
              >
                Confirm Ticket Issue
              </h2>
              <p
                class="m-0 mt-1 text-sm font-medium leading-snug text-ink-secondary lg:mt-0.5 lg:text-[12px] lg:font-normal"
              >
                Review the details below before confirming.
              </p>
            </div>
          </div>
          <div
            class="inline-flex w-fit items-center gap-2 rounded-full border border-[#fed7aa] bg-[#fff4ed] px-3.5 py-2.5 lg:gap-1.5 lg:border-brand/20 lg:bg-[#fff7ed] lg:px-2.5 lg:py-1.5"
          >
            <Ticket size={16} class="shrink-0 text-brand lg:hidden" />
            <Ticket size={14} class="hidden shrink-0 text-brand lg:block" />
            <span class="text-[13px] font-bold text-ink lg:text-[12px]">
              {qty} ticket{qty === 1 ? "" : "s"} · NLe {formatNle(feeTotal)}
            </span>
          </div>
        </div>

        <div
          class="flex flex-col gap-3 rounded-2xl border-[1.5px] border-paper-border bg-white p-5 shadow-sm lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:p-0"
        >
          <p
            class="m-0 text-[13px] font-bold uppercase tracking-wide text-ink-secondary lg:border-b lg:border-paper-border lg:px-3.5 lg:py-2.5 lg:text-[11px]"
          >
            Issue Details
          </p>
          <div
            class="flex items-center justify-between gap-3 text-sm lg:border-b lg:border-paper-border lg:px-3.5 lg:py-2.5 lg:text-[13px]"
          >
            <span class="text-ink-secondary">Event</span>
            <span
              class="truncate text-right font-semibold text-ink lg:font-bold"
              >{event.title}</span
            >
          </div>
          <div class="h-px w-full bg-paper-border lg:hidden"></div>
          <div
            class="flex items-center justify-between gap-3 text-sm lg:border-b lg:border-paper-border lg:px-3.5 lg:py-2.5 lg:text-[13px]"
          >
            <span class="text-ink-secondary">Number of Tickets</span>
            <span class="font-semibold text-ink lg:font-bold">{qty}</span>
          </div>
          <div class="h-px w-full bg-paper-border lg:hidden"></div>
          <div
            class="flex items-center justify-between gap-3 text-sm lg:border-b lg:border-paper-border lg:px-3.5 lg:py-2.5 lg:text-[13px]"
          >
            <span class="text-ink-secondary">Fee per Ticket</span>
            <span class="font-semibold text-ink lg:font-bold"
              >{feeEach.toFixed(2)} NLe</span
            >
          </div>
          <div
            class="flex items-center justify-between gap-3 rounded-xl border border-[#fed7aa] bg-[#fff4ed] p-3 lg:rounded-none lg:border-0 lg:bg-[#fff7ed] lg:px-3.5 lg:py-2.5"
          >
            <span
              class="text-[15px] font-extrabold text-ink lg:text-[13px]"
              >Total Fee</span
            >
            <span
              class="text-lg font-extrabold text-brand lg:font-display lg:text-base lg:font-bold"
              >NLe {formatNle(feeTotal)}</span
            >
          </div>
        </div>

        <div class="flex flex-col gap-2.5 lg:gap-2">
          <p
            class="m-0 text-[13px] font-bold uppercase tracking-wide text-ink-secondary lg:text-[11px]"
          >
            Payment Method
          </p>
          <div
            class="flex items-stretch overflow-hidden rounded-2xl border-[1.5px] border-brand bg-white lg:rounded-lg lg:border-2 lg:bg-[#fff7ed]"
          >
            <span class="w-1.5 shrink-0 bg-brand" aria-hidden="true"></span>
            <div
              class="flex min-w-0 flex-1 items-center justify-between gap-3 p-4 lg:py-2.5 lg:pr-3 lg:pl-2"
            >
              <div class="flex min-w-0 items-center gap-2.5 lg:gap-2">
                <span
                  class="flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-white"
                  aria-hidden="true"
                >
                  <span class="size-2 rounded-full bg-brand"></span>
                </span>
                <span
                  class="text-sm font-bold text-ink lg:text-[13px] lg:font-extrabold"
                  >Wallet Balance</span
                >
              </div>
              <div
                class="flex shrink-0 items-center gap-1.5 text-[#22c55e] lg:text-[#16a34a]"
              >
                <Wallet size={14} class="hidden shrink-0 lg:block" />
                <span class="text-[13px] font-bold lg:text-[12px]"
                  >Available: NLe {formatNle(walletBalance)}</span
                >
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={submitting}
          class="flex w-full items-center justify-center rounded-xl border-0 bg-brand px-6 py-4 text-base font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(237,107,45,0.15)] cursor-pointer hover:opacity-90 disabled:opacity-50 lg:h-9 lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-[13px] lg:font-bold lg:shadow-[0_6px_8px_rgba(255,90,31,0.15)]"
          on:click={confirmIssue}
        >
          {#if submitting}
            Issuing…
          {:else}
            Confirm &amp; Deduct NLe {formatNle(feeTotal)}
          {/if}
        </button>

        <div
          class="flex gap-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4 lg:gap-2 lg:rounded-lg lg:border-brand/15 lg:px-2.5 lg:py-2"
        >
          <div
            class="flex size-6 shrink-0 items-center justify-center rounded-xl bg-[#fff7e6] text-brand lg:mt-0.5 lg:size-auto lg:rounded-none lg:bg-transparent"
          >
            <TriangleAlert size={14} class="shrink-0" />
          </div>
          <p
            class="m-0 text-sm leading-snug text-ink lg:text-[11px] lg:text-ink-secondary"
          >
            This amount will be deducted from your wallet balance immediately.
            Tickets will be permanently created and assigned to the guest.
          </p>
        </div>

        <a
          href="/dashboard/events/eventDetails?id={event.id}&tab=generate"
          class="text-center text-[12px] font-bold text-ink-secondary no-underline hover:text-brand"
        >
          ← Back to Generate
        </a>
      </div>
    </div>
  </div>
{/if}
