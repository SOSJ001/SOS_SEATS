<script>
  // @ts-nocheck
  /** Private-issue Pay Now — desktop HI-FI 156:101 / mobile HI-FI 156:54. */
  import { goto } from "$app/navigation";
  import { onDestroy } from "svelte";
  import CreditCard from "lucide-svelte/icons/credit-card";
  import Lock from "lucide-svelte/icons/lock";
  import Phone from "lucide-svelte/icons/phone";
  import Smartphone from "lucide-svelte/icons/smartphone";
  import ShieldCheck from "lucide-svelte/icons/shield-check";
  import AuthPanelDecor from "$lib/components/auth/AuthPanelDecor.svelte";
  import CheckoutEventHero from "$lib/components/checkout/CheckoutEventHero.svelte";
  import { monimeService } from "$lib/monime";
  import { showToast } from "$lib/store";

  export let data;

  $: event = data.event;
  $: error = data.error;
  $: qty = data.qty || 1;
  $: feeEach = data.feeEach || 0.99;
  $: feeTotal = data.feeTotal || qty * feeEach;

  /** @type {"orange_money" | "afrimoney"} */
  let paymentMethod = "orange_money";
  let phone = "";
  let creating = false;
  let paymentCodeId = "";
  let ussdCode = "";
  let paymentStatus = "idle"; // idle | pending | completed | error
  let fulfilling = false;
  let pollTimer;

  async function createCode() {
    if (!event?.id || creating) return;
    if (!phone.trim()) {
      showToast("error", "Phone required", "Enter a mobile money phone number.");
      return;
    }

    creating = true;
    paymentStatus = "pending";
    try {
      // Exact issue fee (no buyer booking fee / no 5% organiser fee).
      // Keep Monime 1% top-up so net received covers fee after Monime cut.
      const monimeFee = feeTotal * 0.01;
      const chargeAmount = feeTotal + monimeFee;

      const providerMap = {
        orange_money: ["m17"],
        afrimoney: ["m18"],
      };

      const paymentCode = await monimeService.createPaymentCode(
        `${event.title} — Private issue × ${qty}`,
        {
          currency: "SLE",
          value: Math.round(chargeAmount * 100),
        },
        providerMap[paymentMethod] || ["m17"],
        {
          purpose: "private_issue",
          event_id: event.id,
          event_name: event.title,
          qty: String(qty),
          fee_each: String(feeEach),
          fee_total: String(feeTotal),
          payment_method: paymentMethod,
          phone: phone.trim(),
        },
        `private_issue_${event.id}_${Date.now()}`
      );

      paymentCodeId = paymentCode.id;
      ussdCode = paymentCode.ussdCode || "";
      startFulfillPoll();
    } catch (err) {
      paymentStatus = "error";
      showToast(
        "error",
        "Payment code failed",
        err?.message || "Could not create payment code."
      );
    } finally {
      creating = false;
    }
  }

  function startFulfillPoll() {
    stopPoll();
    pollTimer = setInterval(async () => {
      if (!paymentCodeId || fulfilling) return;
      try {
        const status = await monimeService.getPaymentCodeStatus(paymentCodeId);
        const st = String(status?.status || "").toLowerCase();
        if (st === "completed" || st === "paid") {
          stopPoll();
          paymentStatus = "completed";
          await fulfillIssue();
        } else if (["cancelled", "expired", "failed"].includes(st)) {
          stopPoll();
          paymentStatus = "error";
          showToast("error", "Payment ended", `Status: ${st}`);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
  }

  function stopPoll() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function fulfillIssue() {
    if (fulfilling || !event?.id) return;
    fulfilling = true;
    try {
      const res = await fetch(`/api/events/${event.id}/private-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qty,
          method: "fulfill",
          paymentCodeId,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        paymentStatus = "error";
        showToast(
          "error",
          "Issue failed",
          body.error || "Payment ok but tickets were not issued."
        );
        return;
      }
      goto(
        `/dashboard/events/eventDetails/issue-success?id=${event.id}&qty=${body.qty || qty}&method=${paymentMethod}`
      );
    } catch {
      paymentStatus = "error";
      showToast("error", "Issue failed", "Please try again.");
    } finally {
      fulfilling = false;
    }
  }

  onDestroy(stopPoll);
</script>

{#if error || !event}
  <div class="flex min-h-screen items-center justify-center bg-paper p-8">
    <div class="max-w-md rounded-2xl border border-paper-border bg-white p-8 text-center">
      <h1 class="m-0 text-xl font-bold text-ink">Checkout unavailable</h1>
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
      badge="PAY NOW"
      title={event.title}
      date={event.date}
      location={event.location}
      image={event.image}
      ticketLabel={`${qty} ticket${qty === 1 ? "" : "s"}`}
    />

    <div
      class="relative flex flex-1 items-start justify-center overflow-hidden bg-paper px-0 pb-6 pt-0 lg:w-1/2 lg:items-center lg:px-8 lg:py-6"
    >
      <div
        class="pointer-events-none absolute inset-0 hidden lg:block"
        aria-hidden="true"
      >
        <AuthPanelDecor />
      </div>
      <div
        class="relative z-10 flex w-full max-w-none flex-col gap-5 rounded-none border-0 border-paper-border bg-white p-5 shadow-sm lg:max-w-[440px] lg:gap-3 lg:rounded-xl lg:border lg:p-4"
      >
        <div class="flex flex-col gap-3 lg:gap-2">
          <div class="flex items-center gap-2.5 lg:gap-2">
            <span
              class="inline-flex items-center justify-center rounded-full border border-brand/10 bg-[#fff1eb] px-3 py-1.5 text-[11px] font-extrabold uppercase text-brand lg:hidden"
            >
              Issue Fee
            </span>
            <span
              class="hidden size-6 items-center justify-center rounded-lg bg-[#fff1eb] text-brand lg:flex"
            >
              <CreditCard size={14} />
            </span>
            <h2
              class="m-0 text-xl font-extrabold text-ink lg:text-lg"
            >
              Pay Now
            </h2>
          </div>
          <div
            class="flex items-center justify-between text-sm lg:text-[12px]"
          >
            <span class="text-ink-secondary"
              >{qty} × {feeEach.toFixed(2)} NLe</span
            >
            <span class="font-semibold text-ink lg:font-bold"
              >NLe {feeTotal.toFixed(2)}</span
            >
          </div>
          <div class="h-px w-full bg-paper-border lg:hidden"></div>
          <div
            class="flex items-center justify-between rounded-xl border border-brand/10 bg-[#fff7ed] p-3 lg:rounded-lg lg:px-2.5 lg:py-2"
          >
            <span
              class="text-base font-extrabold text-ink lg:text-[13px]"
              >Total Due</span
            >
            <span
              class="font-display text-[22px] font-bold text-brand lg:text-xl"
              >NLe {feeTotal.toFixed(2)}</span
            >
          </div>
        </div>

        <div class="flex flex-col gap-3 lg:gap-2">
          <div class="flex items-center gap-2.5 lg:gap-2">
            <span
              class="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#fff1eb] text-brand lg:size-6 lg:rounded-lg"
            >
              <Lock size={18} class="lg:hidden" />
              <Lock size={14} class="hidden lg:block" />
            </span>
            <h3
              class="m-0 text-lg font-extrabold text-ink lg:text-[14px]"
            >
              Issue private tickets
            </h3>
          </div>

          <p
            class="m-0 text-[13px] font-bold uppercase tracking-wide text-ink-secondary lg:text-[11px]"
          >
            Select Payment Method
          </p>
          <div class="flex gap-3 lg:gap-2">
            <button
              type="button"
              class="flex flex-1 items-center justify-center rounded-xl p-3 text-sm font-extrabold cursor-pointer lg:rounded-lg lg:px-2.5 lg:py-1.5 lg:text-[12px]
                {paymentMethod === 'orange_money'
                ? 'border-2 border-brand bg-[#fff7ed] text-brand'
                : 'border border-paper-border bg-white text-ink-secondary'}"
              on:click={() => (paymentMethod = "orange_money")}
            >
              Orange Money
            </button>
            <button
              type="button"
              class="flex flex-1 items-center justify-center rounded-xl p-3 text-sm font-extrabold cursor-pointer lg:rounded-lg lg:px-2.5 lg:py-1.5 lg:text-[12px]
                {paymentMethod === 'afrimoney'
                ? 'border-2 border-brand bg-[#fff7ed] text-brand'
                : 'border border-paper-border bg-white text-ink-secondary'}"
              on:click={() => (paymentMethod = "afrimoney")}
            >
              Afrimoney
            </button>
          </div>

          <label
            class="m-0 text-sm font-medium text-ink lg:text-[12px]"
            for="mm-phone">Mobile Money Phone Number</label
          >
          <div
            class="flex h-[52px] items-center gap-2.5 rounded-xl border border-paper-border bg-white px-4 lg:h-9 lg:gap-2 lg:rounded-lg lg:px-2.5"
          >
            <Phone size={18} class="shrink-0 text-ink-muted lg:hidden" />
            <Smartphone
              size={14}
              class="hidden shrink-0 text-ink-muted lg:block"
            />
            <input
              id="mm-phone"
              type="tel"
              bind:value={phone}
              placeholder="+232 77 483 920"
              class="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-[#999] lg:text-[13px]"
            />
          </div>

          <button
            type="button"
            disabled={creating || fulfilling || paymentStatus === "pending"}
            class="flex h-[52px] w-full items-center justify-center rounded-xl border-0 bg-brand px-6 text-[15px] font-bold text-white shadow-[0_8px_10px_rgba(255,90,31,0.15)] cursor-pointer hover:opacity-90 disabled:opacity-50 lg:h-9 lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-[13px] lg:shadow-[0_6px_8px_rgba(255,90,31,0.15)]"
            on:click={createCode}
          >
            {#if creating}
              Creating…
            {:else if paymentStatus === "pending"}
              Waiting for payment…
            {:else if fulfilling}
              Issuing tickets…
            {:else}
              Generate Payment Code
            {/if}
          </button>

          {#if ussdCode && paymentStatus === "pending"}
            <div
              class="rounded-xl border border-brand/20 bg-[#fff7ed] px-4 py-3 text-center lg:rounded-lg lg:px-2.5 lg:py-2"
            >
              <p class="m-0 text-[10px] font-bold uppercase text-ink-secondary">
                Dial / confirm
              </p>
              <p class="m-0 mt-0.5 font-display text-base font-bold text-brand">
                {ussdCode}
              </p>
              <p class="m-0 mt-1 text-[11px] text-ink-secondary">
                Waiting for payment confirmation…
              </p>
            </div>
          {/if}

          <div
            class="flex flex-col gap-2 rounded-xl border border-brand/10 bg-[#fff7ed] px-4 py-3 lg:gap-1 lg:rounded-lg lg:px-2.5 lg:py-2"
          >
            <div class="flex items-center gap-2">
              <Smartphone size={16} class="shrink-0 text-ink lg:hidden" />
              <Smartphone size={14} class="hidden shrink-0 text-ink lg:block" />
              <p class="m-0 text-[13px] font-bold text-ink lg:text-[12px]">
                Next Steps
              </p>
            </div>
            <p
              class="m-0 text-[13px] leading-snug text-ink-secondary lg:text-[11px]"
            >
              Complete the payment prompt. Tickets issue onto the guest list
              automatically.
            </p>
          </div>
        </div>

        <div
          class="flex flex-col gap-2 rounded-lg border border-paper-border bg-white px-4 py-3 lg:gap-1 lg:px-2.5 lg:py-2"
        >
          <div class="flex items-center gap-1.5">
            <span
              class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#fff1eb] text-brand lg:size-6 lg:rounded-md"
            >
              <ShieldCheck size={18} class="lg:hidden" />
              <ShieldCheck size={14} class="hidden lg:block" />
            </span>
            <p
              class="m-0 font-display text-base font-bold text-ink lg:text-[13px]"
            >
              Secure Payment
            </p>
          </div>
          <p class="m-0 text-[13px] text-ink-secondary lg:text-[11px] lg:text-[#808080]">
            Encrypted checkout · Fraud protection · On the guest list
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
