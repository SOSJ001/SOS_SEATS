<script lang="ts">
  /**
   * Withdraw Funds: HI-FI withdraw-mobile 36:573, desktop-withdraw 55:1750,
   * validation 1584:773 / 1584:684, confirm 1584:982 / 1584:893, on its way 1584:1186 / 1584:1097,
   * failed 1584:1432 / 1584:1343, on hold 1584:1720 / 1584:1631.
   * The server recomputes fees and limits on submit.
   */
  import { onMount } from "svelte";
  import { LEGAL } from "$lib/legal/legalConfig.js";
  import WithdrawBalanceCard from "$lib/components/wallet/WithdrawBalanceCard.svelte";
  import WithdrawAmountField from "$lib/components/wallet/WithdrawAmountField.svelte";
  import WithdrawProviderPicker from "$lib/components/wallet/WithdrawProviderPicker.svelte";
  import WithdrawPhoneField from "$lib/components/wallet/WithdrawPhoneField.svelte";
  import WithdrawFeeNote from "$lib/components/wallet/WithdrawFeeNote.svelte";
  import WithdrawTipsCard from "$lib/components/wallet/WithdrawTipsCard.svelte";
  import RecentWithdrawalsCard from "$lib/components/wallet/RecentWithdrawalsCard.svelte";
  import WalletInProgressNote from "$lib/components/wallet/WalletInProgressNote.svelte";
  import WithdrawConfirmCard from "$lib/components/wallet/WithdrawConfirmCard.svelte";
  import WithdrawResultHeader from "$lib/components/wallet/WithdrawResultHeader.svelte";
  import WithdrawResultBanner from "$lib/components/wallet/WithdrawResultBanner.svelte";
  import WithdrawReceiptCard from "$lib/components/wallet/WithdrawReceiptCard.svelte";
  import WithdrawFailedHero from "$lib/components/wallet/WithdrawFailedHero.svelte";
  import WithdrawFailedDetails from "$lib/components/wallet/WithdrawFailedDetails.svelte";
  import { walletDataGet, requestWithdrawal, syncPayouts } from "$lib/client/walletData";
  import {
    calculateWithdrawalFee,
    formatPlatformFeePercent,
    formatWithdrawalMonimeFeePercent,
  } from "$lib/fees";
  import { formatSlPhone, displaySlPhone } from "$lib/slPhone";
  import {
    formatNle,
    type WalletHistoryRow,
    type WithdrawProvider,
  } from "$lib/client/walletFormat";

  export const data = undefined;

  type WalletSummary = {
    available: number;
    pending: number;
    withdrawalInProgress: { id: string; amount: number; createdAt: string; onHold: boolean } | null;
  };

  let summary: WalletSummary | null = null;
  let summaryLoading = true;
  let summaryError = false;
  let recent: WalletHistoryRow[] = [];
  let recentLoading = true;

  let amountInput = "";
  let provider: WithdrawProvider = "orange_money";
  let phone = "";
  let amountError = "";
  let phoneError = "";
  let formError = "";
  let submitting = false;
  let step: "form" | "confirm" | "result" = "form";
  /** Checked values shown on the confirm step and sent on confirm */
  let confirmed: { amount: number; phone: string } | null = null;
  /** Server figures for the payout once it is sent, on its way, failed or on hold */
  let result: {
    outcome: "sent" | "on_its_way" | "failed" | "on_hold";
    id: string;
    gross: number;
    fee: number;
    net: number;
    provider: string;
    phone: string;
  } | null = null;

  $: resultCopy = !result || result.outcome === "failed" || result.outcome === "on_hold"
    ? null
    : result.outcome === "sent"
      ? {
          title: "Withdrawal sent",
          message: `${formatNle(result.net)} has been sent to ${displaySlPhone(result.phone)}.`,
          banner: "It shows as Completed in your history.",
        }
      : {
          title: "Withdrawal on its way",
          message: `${formatNle(result.net)} is on its way to ${displaySlPhone(result.phone)}.`,
          banner: "It will show as Completed in your history once the provider confirms.",
        };

  $: amountValue = parseAmount(amountInput);
  $: available = summary?.available ?? null;
  $: inProgress = summary?.withdrawalInProgress ?? null;
  $: nothingToWithdraw = !!summary && !inProgress && summary.available <= 0;
  $: blockedNote = nothingToWithdraw
    ? summary && summary.pending > 0
      ? "Ticket money becomes available 24 hours after your event starts."
      : "You have no money to withdraw yet."
    : null;
  $: formDisabled = submitting || !summary || !!inProgress || nothingToWithdraw;

  // Typing again clears the message for that field
  $: amountInput, (amountError = "");
  $: phone, (phoneError = "");

  function parseAmount(raw: string): number | null {
    const cleaned = raw.replace(/,/g, "").trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
  }

  async function loadSummary() {
    try {
      const result = await walletDataGet("summary");
      if (!result?.success) throw new Error(result?.error);
      summary = result.data;
      summaryError = false;
    } catch (err) {
      console.error("Error loading wallet summary:", err);
      summary = null;
      summaryError = true;
    } finally {
      summaryLoading = false;
    }
  }

  async function loadRecent() {
    try {
      const result = await walletDataGet("history", { filter: "withdrawals", limit: 3 });
      recent = result?.success ? result.data || [] : [];
    } catch (err) {
      console.error("Error loading recent withdrawals:", err);
      recent = [];
    } finally {
      recentLoading = false;
    }
  }

  function loadAll() {
    return Promise.all([loadSummary(), loadRecent()]);
  }

  onMount(async () => {
    await loadAll();
    // A payout that finished since the last visit frees the form
    const synced = await syncPayouts().catch(() => null);
    if (synced?.success && synced.data?.updated > 0) await loadAll();
  });

  function validate(): { amount: number; phone: string } | null {
    amountError = "";
    phoneError = "";
    formError = "";
    const amount = amountValue;
    const normalisedPhone = formatSlPhone(phone);

    if (amount === null || amount <= 0) {
      amountError = "Enter an amount to withdraw.";
    } else if (available !== null && amount > available) {
      amountError = `That's more than your available balance (${formatNle(available)})`;
    } else if (calculateWithdrawalFee(amount).netAmount <= 0) {
      amountError = "Amount is too small after the transfer fee.";
    }
    if (!normalisedPhone) phoneError = "Enter 8 digits after +232";

    if (amountError || phoneError || amount === null || !normalisedPhone) return null;
    return { amount, phone: normalisedPhone };
  }

  /** Puts a server rejection next to the field it is about. */
  function showServerError(message: string) {
    if (/\+232/.test(message)) phoneError = message;
    else if (/amount|balance|nothing to withdraw/i.test(message)) amountError = message;
    else formError = message;
  }

  function review() {
    if (formDisabled) return;
    const checked = validate();
    if (!checked) return;
    confirmed = checked;
    step = "confirm";
  }

  function backToForm() {
    step = "form";
    confirmed = null;
  }

  function tryAgain() {
    result = null;
    backToForm();
  }

  async function send() {
    if (submitting || !confirmed) return;

    submitting = true;
    try {
      const res = await requestWithdrawal({ ...confirmed, provider });
      const d = res?.data;

      if (
        res?.outcome === "sent" ||
        res?.outcome === "on_its_way" ||
        res?.outcome === "failed" ||
        res?.outcome === "on_hold"
      ) {
        result = {
          outcome: res.outcome,
          id: String(d.id || ""),
          gross: Number(d.gross) || 0,
          fee: Number(d.monimeFee) || 0,
          net: Number(d.netAmount) || 0,
          provider: d.provider,
          phone: d.phone,
        };
        step = "result";
        // A failure returns the money to Available, so Try again needs the fresh balance
        if (res.outcome === "failed") await loadAll();
      } else {
        backToForm();
        showServerError(res?.error || "Could not start the withdrawal. Please try again.");
        await loadAll();
      }
    } catch (err) {
      console.error("Withdrawal request error:", err);
      backToForm();
      formError =
        "We couldn't confirm your withdrawal. Check your wallet before trying again.";
      await loadAll();
    } finally {
      submitting = false;
    }
  }
</script>

{#if step === "result" && result}
{#if result.outcome === "failed"}
<div class="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-1 pt-2 lg:p-4">
  <WithdrawFailedHero
    title="Withdrawal failed"
    message="Your withdrawal didn't go through. Your money is still in your wallet."
  />
  <WithdrawFailedDetails gross={result.gross} provider={result.provider} phone={result.phone} />
  <div class="flex flex-col gap-3.5">
    <button
      type="button"
      class="flex w-full cursor-pointer items-center justify-center rounded-xl border-0 bg-brand px-6 py-4 text-base font-bold leading-normal text-white shadow-[0_8px_10px_rgba(255,90,31,0.15)] hover:bg-[#e94e15] lg:py-2.5 lg:text-[13px]"
      on:click={tryAgain}
    >
      Try again
    </button>
    <a
      href="/dashboard/wallet"
      class="flex w-full items-center justify-center rounded-lg border-2 border-solid border-brand bg-paper px-6 py-3.5 text-base font-extrabold leading-normal text-brand no-underline hover:bg-brand-faint lg:py-2 lg:text-[13px]"
    >
      Back to wallet
    </a>
  </div>
</div>
{:else if result.outcome === "on_hold"}
<div class="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-1 pt-2 lg:p-4">
  <WithdrawFailedHero
    title="We couldn't confirm this withdrawal"
    message="{formatNle(result.gross)} is on hold while we check with the mobile money provider. Please contact support before trying again."
  />
  <WithdrawFailedDetails
    gross={result.gross}
    provider={result.provider}
    phone={result.phone}
    status="On hold"
    statusClass="text-[#b45309]"
    noteTitle="This money is reserved"
    noteText="It can't be withdrawn again until the check is finished."
  />
  <div class="flex flex-col gap-3.5">
    <a
      href="mailto:{LEGAL.contactEmail}?subject={encodeURIComponent(
        `Withdrawal on hold (ref ${result.id})`
      )}"
      class="flex w-full items-center justify-center rounded-xl bg-brand px-6 py-4 text-base font-bold leading-normal text-white no-underline shadow-[0_8px_10px_rgba(255,90,31,0.15)] hover:bg-[#e94e15] lg:py-2.5 lg:text-[13px]"
    >
      Contact support
    </a>
    <a
      href="/dashboard/wallet"
      class="flex w-full items-center justify-center rounded-lg border-2 border-solid border-brand bg-paper px-6 py-3.5 text-base font-extrabold leading-normal text-brand no-underline hover:bg-brand-faint lg:py-2 lg:text-[13px]"
    >
      Back to wallet
    </a>
  </div>
</div>
{:else if resultCopy}
<div class="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-1 pt-2 lg:p-4">
  <WithdrawResultHeader title={resultCopy.title} message={resultCopy.message} />
  <WithdrawResultBanner text={resultCopy.banner} />
  <WithdrawReceiptCard
    gross={result.gross}
    fee={result.fee}
    net={result.net}
    provider={result.provider}
    phone={result.phone}
  />
  <a
    href="/dashboard/wallet"
    class="flex w-full items-center justify-center rounded-xl bg-brand px-6 py-4 text-[15px] font-bold leading-normal text-white no-underline shadow-[0_8px_10px_rgba(255,90,31,0.15)] hover:bg-[#e94e15] lg:py-2.5 lg:text-[13px]"
  >
    Back to wallet
  </a>
</div>
{/if}
{:else}
<div class="flex flex-col gap-4 px-1 pt-2 lg:flex-row lg:items-start lg:gap-6 lg:p-4">
  <div class="flex min-w-0 flex-1 flex-col gap-4">
    <p class="m-0 text-[13px] leading-normal text-ink-secondary lg:hidden">
      {step === "confirm" ? "Confirm withdrawal" : "Withdraw to Mobile Money"}
    </p>
    <div class="hidden flex-col gap-2 leading-normal lg:flex">
      {#if step === "confirm"}
        <h1 class="m-0 text-2xl font-extrabold text-ink">Confirm withdrawal</h1>
        <p class="m-0 text-sm text-ink-secondary">Check the details below before you confirm.</p>
      {:else}
        <h1 class="m-0 text-2xl font-extrabold text-ink">Withdraw Funds</h1>
        <p class="m-0 text-sm text-ink-secondary">
          Transfer event proceeds seamlessly to your active mobile wallet.
        </p>
      {/if}
    </div>

    {#if step === "form"}
      <div class="lg:hidden">
        <WithdrawBalanceCard {available} />
      </div>
    {/if}

    {#if summaryError}
      <div
        class="flex flex-col items-center gap-3 rounded-xl border border-paper-border bg-paper px-4 py-6 text-center"
      >
        <p class="m-0 text-sm text-ink-secondary">Could not load your balance.</p>
        <button
          type="button"
          class="cursor-pointer rounded-lg border border-paper-border bg-paper px-4 py-2 text-[13px] font-bold text-ink hover:bg-paper-cream"
          on:click={loadAll}
        >
          Try again
        </button>
      </div>
    {/if}

    {#if inProgress}
      <WalletInProgressNote amount={inProgress.amount} onHold={inProgress.onHold} />
    {/if}

    {#if step === "confirm" && confirmed}
      <WithdrawConfirmCard
        amount={confirmed.amount}
        phone={confirmed.phone}
        {provider}
        {submitting}
        on:confirm={send}
        on:back={backToForm}
      />
    {:else}
      <form
        class="flex flex-col gap-4 lg:rounded-2xl lg:border lg:border-solid lg:border-paper-border lg:bg-paper lg:p-5"
        novalidate
        on:submit|preventDefault={review}
      >
        <WithdrawAmountField
          bind:value={amountInput}
          {available}
          error={amountError}
          disabled={formDisabled}
        />
        <WithdrawProviderPicker bind:provider disabled={formDisabled} />
        <WithdrawPhoneField bind:phone error={phoneError} disabled={formDisabled} />

        {#if formError}
          <p
            class="m-0 rounded-lg bg-[#fef2f2] px-4 py-3 text-xs font-semibold leading-normal text-[#ef4444]"
            role="alert"
          >
            {formError}
          </p>
        {/if}

        <div class="flex flex-col gap-2.5">
          <button
            type="submit"
            class="flex h-12 w-full items-center justify-center rounded-lg border-0 bg-brand text-[15px] font-bold text-white enabled:cursor-pointer enabled:hover:bg-[#e94e15] disabled:cursor-not-allowed disabled:opacity-40 lg:h-10 lg:rounded-xl lg:text-[13px]"
            disabled={formDisabled || summaryLoading}
          >
            <span class="lg:hidden">Withdraw</span>
            <span class="hidden lg:inline">Withdraw Funds</span>
          </button>
          {#if blockedNote}
            <p class="m-0 text-center text-xs text-ink-secondary">{blockedNote}</p>
          {/if}
        </div>
      </form>
    {/if}

    <div class="hidden lg:block">
      <WithdrawFeeNote />
    </div>
    <p class="m-0 text-center text-xs leading-normal text-ink-secondary lg:hidden">
      Ticket sales show your money after our {formatPlatformFeePercent()} fee. When you withdraw,
      only a {formatWithdrawalMonimeFeePercent()} mobile money transfer fee is taken.
    </p>

    <div class="hidden lg:block">
      <WithdrawTipsCard />
    </div>
  </div>

  <aside class="hidden w-[380px] shrink-0 flex-col gap-4 lg:flex">
    <WithdrawBalanceCard {available} />
    <RecentWithdrawalsCard rows={recent} loading={recentLoading} />
  </aside>
</div>
{/if}
