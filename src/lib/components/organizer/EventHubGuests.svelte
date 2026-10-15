<script>
  // @ts-nocheck
  /** Guests tab — desktop HI-FI 527:621 / modal 199:193; mobile HI-FI 374:160 / modal 208:148. */
  import Search from "lucide-svelte/icons/search";
  import Filter from "lucide-svelte/icons/filter";
  import Download from "lucide-svelte/icons/download";
  import Users from "lucide-svelte/icons/users";
  import Check from "lucide-svelte/icons/check";
  import Crown from "lucide-svelte/icons/crown";
  import Clock from "lucide-svelte/icons/clock";
  import Send from "lucide-svelte/icons/send";
  import EntryQrOverlay from "./EntryQrOverlay.svelte";
  import TicketRecipientDialog from "./TicketRecipientDialog.svelte";
  import ReshareWarningDialog from "./ReshareWarningDialog.svelte";
  import GuestSharePill from "./GuestSharePill.svelte";
  import Pagination from "$lib/components/authed/Pagination.svelte";
  import { initialsFromName } from "$lib/components/authed/authedLogout.js";
  import { downloadImage, shareImageDataUrl, showToast } from "$lib/store";
  import { guestTicketCardProps } from "$lib/client/ticketLayout";
  import { exportTicketCardPng } from "$lib/client/exportTicketCard";

  /** @type {any} */
  export let event = null;

  let searchQuery = "";
  let pageIndex = 0;
  const pageSize = 5;
  let qrOpen = false;
  /** @type {any} */
  let qrGuest = null;
  /** @type {EntryQrOverlay} */
  let overlay;

  /** @type {"all" | "not-shared" | "shared"} */
  let shareFilter = "all";
  let recipientOpen = false;
  /** @type {any} */
  let recipientGuest = null;
  /** @type {"download" | "share"} */
  let recipientPrimary = "share";
  let warningOpen = false;
  /** @type {any} */
  let warningGuest = null;
  /** @type {"download" | "share"} */
  let warningVia = "share";
  let sending = false;

  function isPrivateIssued(guest) {
    const status = String(guest.status || "").toLowerCase();
    const type = String(guest.ticketType || "").toLowerCase();
    return (
      status === "issued" ||
      type === "private invite" ||
      guest.specialRequirements === "private_issue"
    );
  }

  function statusLabel(status) {
    const s = String(status || "").toLowerCase().replace(/_/g, "-");
    if (s === "checked-in") return "CHECKED IN";
    if (s === "confirmed") return "CONFIRMED";
    if (s === "issued") return "ISSUED";
    if (s === "pending") return "PENDING";
    return String(status || "—").toUpperCase();
  }

  function statusClass(status) {
    const s = String(status || "").toLowerCase().replace(/_/g, "-");
    if (s === "checked-in") return "bg-[#dcfce7] text-[#22c55e]";
    if (s === "confirmed") return "bg-[#dbeafe] text-[#3b82f6]";
    if (s === "issued") return "bg-[#fef3c7] text-brand";
    if (s === "pending") return "bg-[#fffbeb] text-[#f59e0b]";
    return "bg-paper-cream text-ink-secondary";
  }

  function avatarClass(status) {
    const s = String(status || "").toLowerCase().replace(/_/g, "-");
    if (s === "checked-in") return "bg-[#dcfce7] text-[#22c55e]";
    if (s === "confirmed") return "bg-[#dbeafe] text-[#3b82f6]";
    if (s === "issued" || s === "pending") return "bg-[#fef3c7] text-[#f59e0b]";
    return "bg-brand/10 text-brand";
  }

  $: guests = Array.isArray(event?.guests) ? event.guests : [];
  $: privateGuests = guests.filter((g) => g.qrToken);
  $: privateTotal = privateGuests.length;
  $: sharedTotal = privateGuests.filter((g) => g.sharedAt).length;
  // Unshared tickets keep their default "Private 00X" names, so name order is issue order
  $: nextUnshared =
    privateGuests
      .filter((g) => !g.sharedAt)
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), undefined, {
          numeric: true,
        })
      )[0] || null;

  function matchesShareFilter(g, filter) {
    if (filter === "all") return true;
    if (!g.qrToken) return false;
    return filter === "shared" ? Boolean(g.sharedAt) : !g.sharedAt;
  }

  $: filtered = (() => {
    const q = searchQuery.trim().toLowerCase();
    return guests.filter((g) => {
      if (!matchesShareFilter(g, shareFilter)) return false;
      if (!q) return true;
      return (
        (g.name || "").toLowerCase().includes(q) ||
        (g.email || "").toLowerCase().includes(q) ||
        (g.phone || "").toLowerCase().includes(q) ||
        (g.ticketType || "").toLowerCase().includes(q) ||
        (g.status || "").toLowerCase().includes(q)
      );
    });
  })();

  // Reset to first page when search or share filter changes
  $: searchQuery, shareFilter, (pageIndex = 0);

  $: pageRows = filtered.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );

  $: totalGuests = guests.length;
  $: checkedIn = guests.filter((g) => {
    const s = String(g.status || "").toLowerCase();
    return s === "checked_in" || s === "checked-in";
  }).length;
  $: vipPasses = guests.filter((g) =>
    String(g.ticketType || "").toLowerCase().includes("vip")
  ).length;
  $: pending = guests.filter(
    (g) => String(g.status || "").toLowerCase() === "pending"
  ).length;

  function showQr(guest) {
    qrGuest = guest;
    qrOpen = true;
  }

  async function buildPreview(guest) {
    // Never ship a ticket image without the real entry token
    if (!guest?.qrToken) throw new Error("Missing entry token");
    if (document.fonts?.ready) await document.fonts.ready;
    return exportTicketCardPng({ ...guestTicketCardProps(event, guest), scale: 1.5 });
  }

  function openRecipient(guest, via) {
    recipientGuest = guest;
    recipientPrimary = via;
    recipientOpen = true;
  }

  function startShare(guest, via) {
    if (sending || !guest) return;
    if (guest.sharedAt) {
      warningGuest = guest;
      warningVia = via;
      warningOpen = true;
      return;
    }
    openRecipient(guest, via);
  }

  function shareNext() {
    if (nextUnshared) startShare(nextUnshared, "share");
  }

  function onWarningNext() {
    if (nextUnshared) openRecipient(nextUnshared, warningVia);
  }

  function onWarningAgain() {
    if (warningGuest) openRecipient(warningGuest, warningVia);
  }

  function onRecipientConfirm(e) {
    const { via, name } = e.detail;
    sendTicket(recipientGuest, via, name);
  }

  async function sendTicket(guest, via, name) {
    if (sending || !guest) return;
    sending = true;
    const filename = `ticket-${guest.ticketNumber || guest.id}.png`;
    try {
      let url;
      try {
        url = await buildPreview(guest);
      } catch {
        showToast(
          "error",
          via === "download" ? "Download failed" : "Share failed",
          "Could not build ticket image."
        );
        return;
      }
      if (!url) return;

      if (via === "download") {
        downloadImage(url, filename);
        await recordShared(guest, "download", name);
        return;
      }

      let result;
      try {
        result = await shareImageDataUrl({
          dataUrl: url,
          filename,
          title: event.title || "Ticket",
          text: `Entry ticket for ${name || guest.name || "guest"}`,
        });
      } catch (err) {
        if (err?.name === "AbortError") return;
        showToast("error", "Share failed", "Could not share ticket.");
        return;
      }
      const usedShareSheet =
        result?.method === "web-share-file" ||
        result?.method === "web-share-url";
      await recordShared(guest, usedShareSheet ? "share" : "download", name);
    } finally {
      sending = false;
    }
  }

  async function recordShared(guest, via, name) {
    try {
      const res = await fetch(
        `/api/events/${event.id}/guests/${guest.id}/shared`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ via, name: name || undefined }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || "Save failed");
      event.guests = event.guests.map((g) =>
        g.id === guest.id
          ? {
              ...g,
              name: data.name,
              sharedAt: data.sharedAt,
              sharedVia: data.sharedVia,
              shareCount: data.shareCount,
            }
          : g
      );
    } catch {
      showToast(
        "error",
        "Not saved",
        "Ticket sent, but we couldn't save that it was shared."
      );
    }
  }

  function exportCsv() {
    const header = [
      "Name",
      "Email",
      "Phone",
      "Ticket Type",
      "Status",
      "Ticket Number",
    ];
    const lines = filtered.map((g) =>
      [g.name, g.email, g.phone, g.ticketType, g.status, g.ticketNumber]
        .map((v) => `"${String(v || "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.title || "guests"}-guest-list.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function contactLine(g) {
    if (g.phone && g.email) return g.phone;
    return g.phone || g.email || "—";
  }
</script>

{#if event}
  <div class="flex flex-col gap-4 lg:gap-5">
    <!-- Stats: mobile 2x2 (374:160); desktop 4-up (527:621). Shared EventHubHero above tabs. -->
    <div
      class="grid grid-cols-2 gap-3 lg:gap-4 {privateTotal > 0
        ? 'lg:grid-cols-5'
        : 'lg:grid-cols-4'}"
    >
      <div
        class="flex items-center gap-3 rounded-2xl border border-paper-border bg-[#fff4ed] p-4 shadow-sm lg:gap-4 lg:p-5"
      >
        <span
          class="self-stretch w-[5px] shrink-0 rounded bg-brand"
          aria-hidden="true"
        ></span>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <div class="flex items-center gap-2.5">
            <Users
              size={24}
              class="shrink-0 text-brand"
              aria-hidden="true"
            />
            <p class="m-0 text-2xl font-extrabold leading-none text-brand lg:text-[28px]">
              {totalGuests}
            </p>
          </div>
          <p
            class="m-0 text-[11px] font-semibold uppercase tracking-[0.8px] text-[#666673]"
          >
            Total Guests
          </p>
          <p class="m-0 text-xs text-ink-secondary">All attendees</p>
        </div>
      </div>

      <div
        class="flex items-center gap-3 rounded-2xl border border-paper-border bg-[#ecfdf5] p-4 shadow-sm lg:gap-4 lg:p-5"
      >
        <span
          class="self-stretch w-[5px] shrink-0 rounded bg-[#00e676]"
          aria-hidden="true"
        ></span>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <div class="flex items-center gap-2.5">
            <Check
              size={24}
              class="shrink-0 text-[#16a34a]"
              aria-hidden="true"
            />
            <p
              class="m-0 text-2xl font-extrabold leading-none text-[#16a34a] lg:text-[28px]"
            >
              {checkedIn}
            </p>
          </div>
          <p
            class="m-0 text-[11px] font-semibold uppercase tracking-[0.8px] text-[#666673]"
          >
            Checked In
          </p>
          <p class="m-0 text-xs text-ink-secondary">Arrived attendees</p>
        </div>
      </div>

      <div
        class="flex items-center gap-3 rounded-2xl border border-paper-border bg-[#f0f9ff] p-4 shadow-sm lg:gap-4 lg:p-5"
      >
        <span
          class="self-stretch w-[5px] shrink-0 rounded bg-[#3b82d9]"
          aria-hidden="true"
        ></span>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <div class="flex items-center gap-2.5">
            <Crown
              size={24}
              class="shrink-0 text-[#3b82d9]"
              aria-hidden="true"
            />
            <p class="m-0 text-2xl font-extrabold leading-none text-[#3b82d9] lg:text-[28px]">
              {vipPasses}
            </p>
          </div>
          <p
            class="m-0 text-[11px] font-semibold uppercase tracking-[0.8px] text-[#666673]"
          >
            VIP Passes
          </p>
          <p class="m-0 text-xs text-ink-secondary">Priority attendees</p>
        </div>
      </div>

      <div
        class="flex items-center gap-3 rounded-2xl border border-paper-border bg-[#fffbeb] p-4 shadow-sm lg:gap-4 lg:p-5"
      >
        <span
          class="self-stretch w-[5px] shrink-0 rounded bg-[#f59e0b]"
          aria-hidden="true"
        ></span>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <div class="flex items-center gap-2.5">
            <Clock
              size={24}
              class="shrink-0 text-[#f59e0b]"
              aria-hidden="true"
            />
            <p class="m-0 text-2xl font-extrabold leading-none text-[#f59e0b] lg:text-[28px]">
              {pending}
            </p>
          </div>
          <p
            class="m-0 text-[11px] font-semibold uppercase tracking-[0.8px] text-[#666673]"
          >
            Pending
          </p>
          <p class="m-0 text-xs text-ink-secondary">Awaiting action</p>
        </div>
      </div>

      {#if privateTotal > 0}
        <div
          class="col-span-2 flex items-center gap-3 rounded-2xl border border-paper-border bg-[#f5f3ff] p-4 shadow-sm lg:col-span-1 lg:gap-4 lg:p-5"
        >
          <span
            class="self-stretch w-[5px] shrink-0 rounded bg-[#7c3aed]"
            aria-hidden="true"
          ></span>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <div class="flex items-center gap-2.5">
              <Send
                size={24}
                class="shrink-0 text-[#7c3aed]"
                aria-hidden="true"
              />
              <p
                class="m-0 text-2xl font-extrabold leading-none text-[#7c3aed] lg:text-[28px]"
              >
                {sharedTotal} / {privateTotal}
              </p>
            </div>
            <p
              class="m-0 text-[11px] font-semibold uppercase tracking-[0.8px] text-[#666673]"
            >
              Shared
            </p>
            <p class="m-0 text-xs text-ink-secondary">Private tickets sent</p>
          </div>
        </div>
      {/if}
    </div>

    <!-- SearchAndFilters — HI-FI 705:1442; desktop keeps Export -->
    <div
      class="flex items-center gap-3 rounded-2xl border border-paper-border bg-white p-4 shadow-sm"
    >
      <div
        class="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3"
      >
        <Search
          size={18}
          class="shrink-0 text-ink-secondary"
          aria-hidden="true"
        />
        <input
          type="search"
          bind:value={searchQuery}
          placeholder="Search guest name..."
          class="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-ink-secondary"
        />
      </div>
      <div class="flex shrink-0 items-center gap-2">
        {#if privateTotal > 0}
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl border-0 bg-brand px-4 py-3 text-[13px] font-bold text-white cursor-pointer hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!nextUnshared || sending}
            title={nextUnshared ? "Share the next unshared private ticket" : "All private tickets shared"}
            aria-label="Share next unshared ticket"
            on:click={shareNext}
          >
            <Send size={16} aria-hidden="true" />
            <span class="hidden sm:inline">Share next</span>
          </button>
        {/if}
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-brand bg-white px-4 py-3 text-[13px] font-bold text-brand cursor-pointer disabled:opacity-60"
          disabled
          title="Coming soon"
        >
          <Filter size={16} class="text-brand" aria-hidden="true" />
          Filters
        </button>
        <button
          type="button"
          class="hidden items-center gap-2 rounded-xl border-0 bg-brand px-4 py-3 text-[13px] font-bold text-white cursor-pointer hover:opacity-90 lg:inline-flex"
          on:click={exportCsv}
        >
          <Download size={16} aria-hidden="true" />
          Export
        </button>
      </div>
    </div>

    {#if privateTotal > 0}
      <div
        class="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter by share status"
      >
        {#each [{ id: "all", label: "All", count: guests.length }, { id: "not-shared", label: "Not shared", count: privateTotal - sharedTotal }, { id: "shared", label: "Shared", count: sharedTotal }] as chip (chip.id)}
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold cursor-pointer
              {shareFilter === chip.id
              ? 'border border-brand bg-brand text-white'
              : 'border border-paper-border bg-white text-ink hover:bg-paper-cream'}"
            aria-pressed={shareFilter === chip.id}
            on:click={() => (shareFilter = chip.id)}
          >
            {chip.label}
            <span class="opacity-75">{chip.count}</span>
          </button>
        {/each}
      </div>
    {/if}

    <!-- Mobile guest cards (374:160) -->
    <div class="flex flex-col gap-3 lg:hidden">
      {#if pageRows.length === 0}
        <div
          class="rounded-2xl border border-paper-border bg-white px-4 py-10 text-center text-sm text-ink-secondary shadow-sm"
        >
          No guests found.
        </div>
      {:else}
        {#each pageRows as guest (guest.id)}
          <div
            class="flex flex-col gap-3 rounded-2xl border border-paper-border bg-white p-4 shadow-sm"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold
                  {avatarClass(guest.status)}"
              >
                {initialsFromName(guest.name)}
              </div>
              <div class="min-w-0 flex-1">
                <p class="m-0 truncate text-[15px] font-bold text-ink">
                  {guest.name}
                </p>
                <p class="m-0 truncate text-xs text-ink-secondary">
                  {guest.ticketType || "—"}
                </p>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-1">
                <span
                  class="rounded px-2.5 py-1 text-[11px] font-extrabold uppercase
                    {statusClass(guest.status)}"
                >
                  {statusLabel(guest.status)}
                </span>
                {#if guest.qrToken}
                  <GuestSharePill {guest} />
                {/if}
              </div>
            </div>
            {#if isPrivateIssued(guest)}
              <div
                class="flex flex-wrap items-center gap-2 text-[11px] leading-none"
              >
                <button
                  type="button"
                  class="border-0 bg-transparent p-0 font-bold text-brand cursor-pointer"
                  on:click={() => showQr(guest)}
                >
                  Show entry QR
                </button>
                <span class="text-[#6b6b6b]" aria-hidden="true">·</span>
                <button
                  type="button"
                  class="border-0 bg-transparent p-0 font-bold text-ink cursor-pointer disabled:opacity-50"
                  disabled={sending}
                  on:click={() => startShare(guest, "share")}
                >
                  Share
                </button>
              </div>
            {/if}
          </div>
        {/each}
      {/if}

      <!-- Mobile pagination -->
      <Pagination
        bind:page={pageIndex}
        {pageSize}
        total={filtered.length}
        label="guests"
        class="rounded-2xl border border-paper-border bg-[#faf8f5] px-4 py-3"
      />
    </div>

    <!-- Desktop table (527:664) -->
    <div
      class="hidden overflow-hidden rounded-xl border border-[#e2e8f0] bg-paper shadow-sm lg:block"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-[#e2e8f0] bg-[#faf8f5]">
              <th
                class="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-ink-secondary"
                >Guest Name</th
              >
              <th
                class="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-ink-secondary"
                >Email/Phone</th
              >
              <th
                class="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-ink-secondary"
                >Ticket Type</th
              >
              <th
                class="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-ink-secondary"
                >Status</th
              >
              <th
                class="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-ink-secondary"
                >Actions</th
              >
            </tr>
          </thead>
          <tbody>
            {#if pageRows.length === 0}
              <tr>
                <td
                  colspan="5"
                  class="px-4 py-10 text-center text-ink-secondary"
                >
                  No guests found.
                </td>
              </tr>
            {:else}
              {#each pageRows as guest, i (guest.id)}
                <tr
                  class="border-b border-[#e2e8f0] last:border-0
                    {i % 2 === 0 ? 'bg-[#f8fafc]' : 'bg-white'}"
                >
                  <td class="px-4 py-3 text-[13px] font-bold text-ink"
                    >{guest.name}</td
                  >
                  <td class="px-4 py-3 text-[13px] font-medium text-ink-secondary"
                    >{contactLine(guest)}</td
                  >
                  <td class="px-4 py-3 text-[13px] font-semibold text-ink"
                    >{guest.ticketType}</td
                  >
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span
                        class="inline-flex rounded px-2.5 py-1 text-[11px] font-extrabold
                          {statusClass(guest.status)}"
                      >
                        {statusLabel(guest.status)}
                      </span>
                      {#if guest.qrToken}
                        <GuestSharePill {guest} />
                      {/if}
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    {#if isPrivateIssued(guest)}
                      <div class="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          class="rounded-lg bg-brand/10 px-2 py-1.5 text-[12px] font-bold text-brand cursor-pointer hover:bg-brand/15"
                          on:click={() => showQr(guest)}
                        >
                          Show entry QR
                        </button>
                        <span class="text-[12px] text-[#e2e8f0]" aria-hidden="true"
                          >|</span
                        >
                        <button
                          type="button"
                          class="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1.5 text-[12px] font-bold text-ink cursor-pointer hover:bg-white disabled:opacity-50"
                          disabled={sending}
                          on:click={() => startShare(guest, "share")}
                        >
                          Share
                        </button>
                      </div>
                    {:else}
                      <span class="text-[13px] text-ink-secondary"
                        >No pending actions</span
                      >
                    {/if}
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>

      <Pagination
        bind:page={pageIndex}
        {pageSize}
        total={filtered.length}
        label="guests"
        class="border-t border-[#e2e8f0] bg-[#faf8f5] px-4 py-3"
      />
    </div>
  </div>

  <EntryQrOverlay bind:this={overlay} bind:open={qrOpen} {event} guest={qrGuest} />
  <ReshareWarningDialog
    bind:open={warningOpen}
    guest={warningGuest}
    hasNext={Boolean(nextUnshared)}
    on:next={onWarningNext}
    on:again={onWarningAgain}
  />
  <TicketRecipientDialog
    bind:open={recipientOpen}
    guest={recipientGuest}
    primary={recipientPrimary}
    on:confirm={onRecipientConfirm}
  />
{/if}
