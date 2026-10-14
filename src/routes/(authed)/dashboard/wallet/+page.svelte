<script lang="ts">
  /**
   * Wallet & Proceeds: HI-FI desktop-wallet 55:1642, mobile wallet-proceeds 4:796.
   * Figures and history come from /api/wallet/data (summary, history).
   */
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import WalletBalanceCard from "$lib/components/wallet/WalletBalanceCard.svelte";
  import WalletHistoryTabs from "$lib/components/wallet/WalletHistoryTabs.svelte";
  import WalletHistoryTable from "$lib/components/wallet/WalletHistoryTable.svelte";
  import WalletHistoryList from "$lib/components/wallet/WalletHistoryList.svelte";
  import WalletEmptyState from "$lib/components/wallet/WalletEmptyState.svelte";
  import Pagination from "$lib/components/authed/Pagination.svelte";
  import { walletDataGet, syncPayouts } from "$lib/client/walletData";
  import { formatPlatformFeePercent, formatWithdrawalMonimeFeePercent } from "$lib/fees";
  import type { WalletHistoryFilter, WalletHistoryRow } from "$lib/client/walletFormat";

  export const data = undefined;

  type WalletSummary = {
    available: number;
    pending: number;
    totalEarned: number;
    withdrawalInProgress: { id: string; amount: number; createdAt: string; onHold: boolean } | null;
  };

  const HISTORY_LIMIT = 1000;
  const PAGE_SIZE = 5;

  let summary: WalletSummary | null = null;
  let summaryError = false;
  let rows: WalletHistoryRow[] = [];
  let historyLoading = true;
  let historyError = false;
  let filter: WalletHistoryFilter = "all";
  let historyRequest = 0;
  let page = 0;

  $: pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  $: canWithdraw =
    !!summary && summary.available > 0 && !summary.withdrawalInProgress;
  $: withdrawNote =
    summary && !summary.withdrawalInProgress && summary.available <= 0 && summary.pending > 0
      ? "Ticket money becomes available 24 hours after your event starts."
      : null;
  $: loadFailed = summaryError || historyError;

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
    }
  }

  async function loadHistory() {
    const request = ++historyRequest;
    historyLoading = true;
    try {
      const result = await walletDataGet("history", { filter, limit: HISTORY_LIMIT });
      if (request !== historyRequest) return;
      if (!result?.success) throw new Error(result?.error);
      rows = result.data || [];
      historyError = false;
    } catch (err) {
      if (request !== historyRequest) return;
      console.error("Error loading wallet history:", err);
      rows = [];
      historyError = true;
    } finally {
      if (request === historyRequest) historyLoading = false;
    }
  }

  function loadAll() {
    return Promise.all([loadSummary(), loadHistory()]);
  }

  onMount(async () => {
    await loadAll();
    // Pick up payouts that finished since the last visit
    const synced = await syncPayouts().catch(() => null);
    if (synced?.success && synced.data?.updated > 0) await loadAll();
  });
</script>

<div class="flex flex-col gap-8 px-1 lg:gap-6 lg:p-2">
  <WalletBalanceCard
    available={summary?.available ?? null}
    pending={summary?.pending ?? null}
    totalEarned={summary?.totalEarned ?? null}
    {canWithdraw}
    note={withdrawNote}
    inProgressAmount={summary?.withdrawalInProgress?.amount ?? null}
    inProgressOnHold={summary?.withdrawalInProgress?.onHold ?? false}
    on:withdraw={() => goto("/dashboard/wallet/withdraw")}
  />

  <section
    class="flex flex-col gap-3 lg:gap-4 lg:rounded-2xl lg:border lg:border-solid lg:border-paper-border lg:bg-paper lg:p-6"
    aria-labelledby="wallet-history-title"
  >
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <h2
        id="wallet-history-title"
        class="m-0 text-base font-extrabold leading-normal text-ink lg:text-lg"
      >
        Transaction History
      </h2>
      <WalletHistoryTabs
        {filter}
        on:change={(e) => {
          filter = e.detail;
          page = 0;
          loadHistory();
        }}
      />
    </div>

    {#if loadFailed}
      <div
        class="flex flex-col items-center gap-3 rounded-xl border border-paper-border bg-paper px-4 py-8 text-center lg:border-0"
      >
        <p class="m-0 text-sm text-ink-secondary">Could not load your wallet.</p>
        <button
          type="button"
          class="cursor-pointer rounded-lg border border-paper-border bg-paper px-4 py-2 text-[13px] font-bold text-ink hover:bg-paper-cream"
          on:click={loadAll}
        >
          Try again
        </button>
      </div>
    {:else if historyLoading}
      <p
        class="m-0 rounded-xl border border-paper-border bg-paper px-4 py-8 text-center text-sm text-ink-secondary lg:border-0"
      >
        Loading transactions...
      </p>
    {:else if rows.length === 0}
      <WalletEmptyState {filter} />
    {:else}
      <div class="hidden lg:block">
        <WalletHistoryTable rows={pageRows} />
      </div>
      <div class="lg:hidden">
        <WalletHistoryList rows={pageRows} />
      </div>
      <Pagination
        bind:page
        pageSize={PAGE_SIZE}
        total={rows.length}
        label="transactions"
        class="rounded-2xl border border-paper-border bg-paper-cream px-4 py-3 lg:rounded-xl"
      />
    {/if}

    <p class="m-0 pt-1 text-xs leading-[1.4] text-ink-secondary lg:pt-0 lg:leading-normal">
      Ticket sales show your money after our {formatPlatformFeePercent()} fee. When you withdraw,
      only a {formatWithdrawalMonimeFeePercent()} mobile money transfer fee is taken.
    </p>
  </section>
</div>
