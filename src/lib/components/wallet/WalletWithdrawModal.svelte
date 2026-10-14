<script lang="ts">
  /**
   * Withdraw popup for the wallet page. Amounts come from GET /api/wallet/withdraw;
   * the server recomputes them when the payout is made.
   */
  import { createEventDispatcher, onDestroy } from "svelte";
  import { X } from "lucide-svelte";
  import { sessionFromDb, showToast } from "$lib/store";
  import { getWithdrawable, requestWithdrawal } from "$lib/client/walletData";
  import { formatWithdrawalMonimeFeePercent } from "$lib/fees";
  import { formatNle } from "$lib/client/walletFormat";

  export let open = false;

  type Provider = "orange_money" | "afrimoney";

  const dispatch = createEventDispatcher<{ done: void }>();
  const providers: { id: Provider; label: string }[] = [
    { id: "orange_money", label: "Orange Money" },
    { id: "afrimoney", label: "Afrimoney" },
  ];

  let provider: Provider = "orange_money";
  let phone = "";
  let isLoading = false;
  let isWithdrawing = false;
  let loadError = "";
  let amount = 0;
  let transferFee = 0;
  let netAmount = 0;
  let listening = false;
  let wasOpen = false;

  $: if (open && !wasOpen) {
    wasOpen = true;
    reset();
    loadPreview();
  } else if (!open && wasOpen) {
    wasOpen = false;
  }

  $: syncEscape(open);

  function reset() {
    provider = "orange_money";
    phone = "";
    loadError = "";
    amount = 0;
    transferFee = 0;
    netAmount = 0;
  }

  async function loadPreview() {
    isLoading = true;
    try {
      const result = await getWithdrawable();
      if (!result?.success) throw new Error(result?.error || "Could not load your balance");
      amount = Number(result.data?.available) || 0;
      transferFee = Number(result.data?.fees?.monimeFee) || 0;
      netAmount = Number(result.data?.fees?.netAmount) || 0;
    } catch (err: any) {
      loadError = err?.message || "Could not load your balance";
    } finally {
      isLoading = false;
    }
  }

  function close() {
    if (isWithdrawing) return;
    open = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  function syncEscape(isOpen: boolean) {
    if (typeof document === "undefined") return;
    if (isOpen && !listening) {
      document.addEventListener("keydown", onKeydown);
      listening = true;
    } else if (!isOpen && listening) {
      document.removeEventListener("keydown", onKeydown);
      listening = false;
    }
  }

  onDestroy(() => syncEscape(false));

  async function confirm() {
    if (isWithdrawing || netAmount <= 0) return;
    if (!$sessionFromDb) {
      showToast("error", "Login Required", "Please log in to withdraw.", 5000);
      return;
    }
    const trimmed = phone.trim();
    if (!trimmed) {
      showToast("error", "Phone Number Required", "Please enter your mobile money number.", 5000);
      return;
    }

    isWithdrawing = true;
    try {
      const result = await requestWithdrawal({ phone: trimmed, provider });
      if (!result?.success) {
        showToast(
          "error",
          "Withdrawal Failed",
          result?.error || "Failed to process withdrawal. Please try again.",
          8000
        );
        return;
      }

      const w = result.data;
      if (w.status === "completed") {
        showToast(
          "success",
          "Withdrawal Successful",
          `${formatNle(w.netAmount)} has been sent to ${w.phone}.`,
          8000
        );
      } else {
        showToast(
          "info",
          "Withdrawal On Its Way",
          `${formatNle(w.netAmount)} is on its way to ${w.phone}.`,
          10000
        );
      }
      isWithdrawing = false;
      open = false;
      dispatch("done");
    } catch (err: any) {
      showToast(
        "error",
        "Withdrawal Failed",
        err?.message || "Failed to process withdrawal. Please try again.",
        8000
      );
    } finally {
      isWithdrawing = false;
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-ink/70 p-5"
    role="presentation"
    on:click|self={close}
  >
    <div
      class="my-auto flex w-full max-w-[420px] flex-col gap-5 rounded-2xl border border-paper-border bg-paper p-6 shadow-[0px_8px_28px_rgba(18,4,28,0.18)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-modal-title"
    >
      <div class="flex items-center justify-between gap-3">
        <h2 id="withdraw-modal-title" class="m-0 text-xl font-extrabold text-ink">
          Withdraw to Mobile Money
        </h2>
        <button
          type="button"
          class="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-paper-cream text-ink hover:bg-paper-border disabled:cursor-not-allowed"
          aria-label="Close"
          disabled={isWithdrawing}
          on:click={close}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div class="flex flex-col gap-2 rounded-xl border border-paper-border bg-paper-cream p-4 text-sm">
        {#if isLoading}
          <p class="m-0 text-ink-secondary">Loading your balance...</p>
        {:else if loadError}
          <p class="m-0 text-[#ef4444]">{loadError}</p>
        {:else}
          <div class="flex items-center justify-between gap-3">
            <span class="text-ink-secondary">Amount</span>
            <span class="font-bold text-ink">{formatNle(amount)}</span>
          </div>
          <div class="flex items-center justify-between gap-3">
            <span class="text-ink-secondary">
              Mobile money transfer fee ({formatWithdrawalMonimeFeePercent()})
            </span>
            <span class="font-bold text-ink">-{formatNle(transferFee)}</span>
          </div>
          <div class="h-px w-full bg-paper-border"></div>
          <div class="flex items-center justify-between gap-3">
            <span class="font-bold text-ink">You'll receive</span>
            <span class="font-display text-lg font-bold text-brand">{formatNle(netAmount)}</span>
          </div>
        {/if}
      </div>

      <div class="flex flex-col gap-2">
        <p class="m-0 text-sm font-bold text-ink">Mobile money provider</p>
        <div class="grid grid-cols-2 gap-3" role="group" aria-label="Mobile money provider">
          {#each providers as p}
            {@const active = provider === p.id}
            <button
              type="button"
              class="h-11 cursor-pointer rounded-lg border-2 border-solid text-sm font-bold {active
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-paper-border bg-paper text-ink hover:border-ink-muted'}"
              aria-pressed={active}
              disabled={isWithdrawing}
              on:click={() => (provider = p.id)}
            >
              {p.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label for="withdraw-phone" class="text-sm font-bold text-ink">Phone number</label>
        <input
          id="withdraw-phone"
          type="tel"
          bind:value={phone}
          placeholder="+23278000000"
          disabled={isWithdrawing}
          class="h-11 w-full rounded-lg border border-paper-border bg-paper px-4 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <p class="m-0 text-xs text-ink-secondary">Use +232 followed by 8 digits.</p>
      </div>

      <div class="flex gap-3">
        <button
          type="button"
          class="flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-lg border border-paper-border bg-paper text-sm font-bold text-ink hover:bg-paper-cream disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isWithdrawing}
          on:click={close}
        >
          Cancel
        </button>
        <button
          type="button"
          class="flex h-11 min-w-0 flex-1 items-center justify-center rounded-lg border-0 bg-brand text-sm font-bold text-white enabled:cursor-pointer enabled:hover:bg-[#e94e15] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isWithdrawing || isLoading || !!loadError || netAmount <= 0 || !phone.trim()}
          on:click={confirm}
        >
          {isWithdrawing ? "Processing..." : "Confirm Withdrawal"}
        </button>
      </div>
    </div>
  </div>
{/if}
