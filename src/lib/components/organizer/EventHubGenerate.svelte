<script>
  // @ts-nocheck
  /** Generate tab — desktop HI-FI 199:350 / mobile HI-FI 208:219. */
  import { goto } from "$app/navigation";
  import Minus from "lucide-svelte/icons/minus";
  import Plus from "lucide-svelte/icons/plus";
  import Ticket from "lucide-svelte/icons/ticket";
  import Wallet from "lucide-svelte/icons/wallet";
  import Smartphone from "lucide-svelte/icons/smartphone";
  import Info from "lucide-svelte/icons/info";

  /** @type {any} */
  export let event = null;
  export let walletBalance = 0;

  const FEE_EACH = 0.99;

  let qty = 1;
  /** @type {"wallet" | "mobile_money"} */
  let method = "wallet";

  $: feeTotal = Math.round(qty * FEE_EACH * 100) / 100;
  $: privateGuests = (event?.guests || []).filter((g) => {
    const s = String(g.status || "").toLowerCase();
    const t = String(g.ticketType || "").toLowerCase();
    return (
      s === "issued" ||
      t === "private invite" ||
      g.specialRequirements === "private_issue"
    );
  });
  $: recent = [...privateGuests]
    .sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    })
    .slice(0, 3);

  $: issuedToday = privateGuests.filter((g) => {
    if (!g.createdAt) return false;
    const d = new Date(g.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  $: issuedWeek = privateGuests.filter((g) => {
    if (!g.createdAt) return false;
    const d = new Date(g.createdAt).getTime();
    const weekAgo = Date.now() - 7 * 86400000;
    return d >= weekAgo;
  }).length;

  function setQty(n) {
    qty = Math.min(500, Math.max(1, n));
  }

  function dec() {
    setQty(qty - 1);
  }
  function inc() {
    setQty(qty + 1);
  }

  function onQtyInput(e) {
    const v = e.currentTarget.value;
    if (v === "" || v === null) return;
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return;
    setQty(n);
  }

  function onQtyBlur(e) {
    const n = parseInt(e.currentTarget.value, 10);
    setQty(Number.isFinite(n) ? n : 1);
    e.currentTarget.value = String(qty);
  }

  function guestsHref() {
    return `/dashboard/events/eventDetails?id=${event.id}&tab=guests`;
  }

  function formatWhen(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    if (sameDay) return `Today, ${time}`;
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return `Yesterday, ${time}`;
    return (
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      `, ${time}`
    );
  }

  function initials(name) {
    const parts = String(name || "G").trim().split(/\s+/);
    return ((parts[0]?.[0] || "G") + (parts[1]?.[0] || "")).toUpperCase();
  }

  function submit() {
    if (!event?.id) return;
    if (method === "mobile_money") {
      goto(
        `/dashboard/events/eventDetails/pay-now?id=${event.id}&qty=${qty}`
      );
      return;
    }
    goto(
      `/dashboard/events/eventDetails/confirm-issue?id=${event.id}&qty=${qty}`
    );
  }
</script>

{#if event}
  <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <div
        class="flex items-center gap-3 overflow-hidden rounded-2xl border border-paper-border bg-gradient-to-r from-[#fff7f1] to-[#fff4ed] p-4 shadow-sm lg:justify-between lg:p-6"
      >
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-brand/10 text-brand lg:order-2 lg:size-14"
        >
          <Ticket size={24} class="lg:hidden" aria-hidden="true" />
          <Ticket size={28} class="hidden lg:block" aria-hidden="true" />
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-1 lg:order-1 lg:gap-1.5">
          <h2 class="m-0 text-lg font-extrabold text-ink lg:text-xl">
            Generate Private Tickets
          </h2>
          <p
            class="m-0 text-[13px] font-medium leading-snug text-ink-secondary"
          >
            Each ticket is added to your guest list with a unique QR code ready to
            share.
          </p>
        </div>
      </div>

      <div
        class="contents lg:flex lg:flex-col lg:gap-4 lg:rounded-2xl lg:border lg:border-paper-border lg:bg-[#fff7f1] lg:p-6 lg:shadow-sm"
      >
        <div
          class="flex flex-col gap-3 rounded-xl border border-paper-border bg-white p-4 shadow-sm lg:gap-3 lg:rounded-xl lg:p-5"
        >
          <p
            class="m-0 text-[13px] font-medium text-ink-secondary lg:text-xs lg:font-semibold lg:uppercase lg:tracking-wide"
          >
            Number of Tickets to Generate
          </p>
          <div
            class="flex h-12 items-center overflow-hidden rounded-lg border border-paper-border bg-white shadow-sm lg:h-14"
          >
            <button
              type="button"
              class="flex h-full w-12 items-center justify-center border-0 border-r border-paper-border bg-white cursor-pointer"
              on:click={dec}
              aria-label="Decrease"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              min="1"
              max="500"
              inputmode="numeric"
              value={qty}
              on:input={onQtyInput}
              on:blur={onQtyBlur}
              aria-label="Number of tickets to generate"
              class="h-full min-w-0 flex-1 border-0 bg-white text-center text-lg font-bold text-ink outline-none lg:bg-[#fff7f1] lg:text-xl lg:font-extrabold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              class="flex h-full w-12 items-center justify-center border-0 bg-brand text-white cursor-pointer"
              on:click={inc}
              aria-label="Increase"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div
          class="flex flex-col gap-3 rounded-xl border border-paper-border bg-white p-4 shadow-sm lg:gap-3 lg:rounded-xl lg:p-5"
        >
          <p
            class="m-0 text-[13px] font-bold text-ink-secondary lg:uppercase lg:tracking-wide"
          >
            Cost &amp; Limits Summary
          </p>
          <div class="flex items-center justify-between text-sm">
            <span class="text-ink-secondary">{qty} × Fixed Gateway Fee</span>
            <span class="font-semibold text-ink"
              >{FEE_EACH.toFixed(2)} NLe each</span
            >
          </div>
          <div class="h-px w-full bg-paper-border"></div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-ink">Total Fee Due:</span>
            <span class="text-base font-extrabold text-brand"
              >NLe {feeTotal.toFixed(2)}</span
            >
          </div>
          <div class="h-px w-full bg-paper-border"></div>
          <p
            class="m-0 text-xs font-bold text-ink-secondary lg:uppercase lg:tracking-wide"
          >
            Deduct Fees From
          </p>
          <div class="flex gap-2 lg:gap-3">
            <button
              type="button"
              class="flex flex-1 items-center gap-2 rounded-lg border p-3 text-left cursor-pointer lg:gap-3 lg:rounded-xl lg:p-4
                {method === 'wallet'
                ? 'border-[1.5px] border-brand bg-white lg:bg-[#fff7f1]'
                : 'border-paper-border bg-white'}"
              on:click={() => (method = "wallet")}
            >
              <span
                class="size-4 shrink-0 rounded-full border-2
                  {method === 'wallet'
                  ? 'border-brand bg-brand'
                  : 'border-paper-border bg-white'}"
                aria-hidden="true"
              ></span>
              <span class="min-w-0 flex-1">
                <span
                  class="block text-[13px]
                    {method === 'wallet'
                    ? 'font-bold text-ink'
                    : 'font-normal text-ink-secondary lg:font-bold lg:text-ink'}"
                  >Wallet Balance</span
                >
                <span
                  class="hidden text-[11px] text-ink-secondary lg:block"
                  >Instant deduction</span
                >
              </span>
              <Wallet
                size={16}
                class="hidden shrink-0 text-ink-secondary lg:block"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              class="flex flex-1 items-center gap-2 rounded-lg border p-3 text-left cursor-pointer lg:gap-3 lg:rounded-xl lg:p-4
                {method === 'mobile_money'
                ? 'border-[1.5px] border-brand bg-white lg:bg-[#fff7f1]'
                : 'border-paper-border bg-white'}"
              on:click={() => (method = "mobile_money")}
            >
              <span
                class="size-4 shrink-0 rounded-full border-2
                  {method === 'mobile_money'
                  ? 'border-brand bg-brand'
                  : 'border-paper-border bg-white'}"
                aria-hidden="true"
              ></span>
              <span class="min-w-0 flex-1">
                <span
                  class="block text-[13px]
                    {method === 'mobile_money'
                    ? 'font-bold text-ink'
                    : 'font-normal text-ink-secondary lg:font-bold lg:text-ink'}"
                  >Mobile Money</span
                >
                <span
                  class="hidden text-[11px] text-ink-secondary lg:block"
                  >Pay via mobile</span
                >
              </span>
              <Smartphone
                size={16}
                class="hidden shrink-0 text-ink-secondary lg:block"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <button
          type="button"
          class="flex h-12 w-full items-center justify-center rounded-lg border-0 bg-brand px-3 text-[15px] font-bold text-white shadow-[0_6px_8px_rgba(255,90,31,0.18)] cursor-pointer hover:opacity-90 lg:h-14 lg:rounded-xl lg:text-base"
          on:click={submit}
        >
          Generate {qty} Ticket{qty === 1 ? "" : "s"}
        </button>

        <div
          class="flex gap-2.5 rounded-lg border border-[#fed7aa] bg-[#fff7ed] p-3.5 lg:rounded-xl lg:p-4"
        >
          <div
            class="flex size-6 shrink-0 items-center justify-center rounded-xl bg-[#fff1e6] text-brand"
          >
            <Info size={14} aria-hidden="true" />
          </div>
          <p class="m-0 text-xs leading-normal text-ink lg:text-[13px]">
            You'll share tickets directly from the guest list after generating.
          </p>
        </div>
      </div>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-4 lg:w-[420px]">
      <div
        class="flex flex-col gap-3 rounded-2xl border border-paper-border bg-white p-4 shadow-sm lg:gap-4 lg:p-5"
      >
        <div class="flex items-center justify-between">
          <h3 class="m-0 text-base font-extrabold text-ink">
            Recent Private Tickets
          </h3>
          <a
            href={guestsHref()}
            class="text-[13px] font-bold text-brand no-underline hover:underline"
          >
            View All
          </a>
        </div>
        {#if recent.length === 0}
          <p class="m-0 text-[13px] text-ink-secondary">No private tickets yet.</p>
        {:else}
          <ul class="m-0 flex list-none flex-col p-0">
            {#each recent as g, i}
              {#if i > 0}
                <li class="h-px w-full bg-paper-border" aria-hidden="true"></li>
              {/if}
              <li class="flex items-center gap-3 py-3">
                <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fff4eb] text-[13px] font-bold text-brand"
                >
                  {initials(g.name)}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="m-0 truncate text-sm font-bold text-ink">
                    {g.name}
                  </p>
                  <p class="m-0 text-xs font-medium text-[#94a3b8]">
                    {formatWhen(g.createdAt)}
                  </p>
                </div>
                <span
                  class="shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold
                    {String(g.status).toLowerCase() === 'pending'
                    ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.1)] text-[#b45309]'
                    : 'border-accent-green bg-accent-green-soft text-accent-green'}"
                >
                  {String(g.status).toLowerCase() === "pending"
                    ? "Pending"
                    : "Issued"}
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div
        class="flex flex-col gap-3 rounded-2xl border border-paper-border bg-white p-4 shadow-sm lg:gap-4 lg:p-5"
      >
        <h3 class="m-0 text-base font-extrabold text-ink">
          Private Ticket Summary
        </h3>
        <div class="flex gap-3">
          <div
            class="flex flex-1 flex-col gap-2 rounded-2xl border border-paper-border bg-[#fff4ed] p-4 shadow-sm"
          >
            <div class="flex items-center gap-2">
              <span
                class="h-9 w-1.5 rounded-sm bg-brand"
                aria-hidden="true"
              ></span>
              <span
                class="rounded-full bg-brand/10 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-brand"
                >Today</span
              >
            </div>
            <p class="m-0 text-[32px] font-extrabold leading-none text-brand">
              {issuedToday}
            </p>
            <p
              class="m-0 text-[11px] font-bold uppercase tracking-wide text-ink-secondary"
            >
              Issued Today
            </p>
          </div>
          <div
            class="flex flex-1 flex-col gap-2 rounded-2xl border border-paper-border bg-[#ecfdf5] p-4 shadow-sm"
          >
            <div class="flex items-center gap-2">
              <span
                class="h-9 w-1.5 rounded-sm bg-accent-green"
                aria-hidden="true"
              ></span>
              <span
                class="rounded-full bg-accent-green-soft px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-accent-green"
                >This Week</span
              >
            </div>
            <p
              class="m-0 text-[32px] font-extrabold leading-none text-accent-green"
            >
              {issuedWeek}
            </p>
            <p
              class="m-0 text-[11px] font-bold uppercase tracking-wide text-ink-secondary"
            >
              Issued This Week
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
