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
  import EntryQrOverlay from "./EntryQrOverlay.svelte";
  import { initialsFromName } from "$lib/components/authed/authedLogout.js";
  import {
    generateTicketPreview,
    defaultTicketDesignConfig,
    downloadImage,
    shareImageDataUrl,
    showToast,
  } from "$lib/store";

  /** @type {any} */
  export let event = null;

  let searchQuery = "";
  let pageIndex = 0;
  const pageSize = 10;
  let qrOpen = false;
  /** @type {any} */
  let qrGuest = null;
  /** @type {EntryQrOverlay} */
  let overlay;

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
  $: filtered = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((g) => {
      return (
        (g.name || "").toLowerCase().includes(q) ||
        (g.email || "").toLowerCase().includes(q) ||
        (g.phone || "").toLowerCase().includes(q) ||
        (g.ticketType || "").toLowerCase().includes(q) ||
        (g.status || "").toLowerCase().includes(q)
      );
    });
  })();

  // Reset to first page when search changes
  $: searchQuery, (pageIndex = 0);

  $: totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  $: if (pageIndex >= totalPages) pageIndex = Math.max(0, totalPages - 1);
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

  /** Up to 5 page numbers centered around current page. */
  $: pageChips = (() => {
    const max = totalPages;
    if (max <= 5) {
      return Array.from({ length: max }, (_, i) => i);
    }
    let start = Math.max(0, pageIndex - 2);
    let end = start + 5;
    if (end > max) {
      end = max;
      start = max - 5;
    }
    return Array.from({ length: end - start }, (_, i) => start + i);
  })();

  function showQr(guest) {
    qrGuest = guest;
    qrOpen = true;
  }

  async function buildPreview(guest) {
    return generateTicketPreview({
      eventName: event.title || "Event",
      eventDate: event.rawDate || event.date,
      eventTime: event.time,
      eventLocation: event.location,
      eventImage: event.image,
      ticketTypeName: guest.ticketType || "Private Invite",
      ticketPrice: "0",
      guestName: guest.name || "Guest",
      ticketNumber: guest.ticketNumber || guest.id,
      qrData: guest.ticketNumber || guest.id,
      designConfig: event.ticketDesignConfig || defaultTicketDesignConfig,
    });
  }

  async function downloadTicket(guest) {
    try {
      const url = await buildPreview(guest);
      if (url) {
        downloadImage(url, `ticket-${guest.ticketNumber || guest.id}.png`);
      }
    } catch {
      showToast("error", "Download failed", "Could not build ticket image.");
    }
  }

  async function shareTicket(guest) {
    try {
      const url = await buildPreview(guest);
      if (url) {
        await shareImageDataUrl({
          dataUrl: url,
          filename: `ticket-${guest.ticketNumber || guest.id}.png`,
          title: event.title || "Ticket",
          text: `Entry ticket for ${guest.name || "guest"}`,
        });
      }
    } catch {
      showToast("error", "Share failed", "Could not share ticket.");
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
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
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
              <span
                class="shrink-0 rounded px-2.5 py-1 text-[11px] font-extrabold uppercase
                  {statusClass(guest.status)}"
              >
                {statusLabel(guest.status)}
              </span>
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
                  class="border-0 bg-transparent p-0 font-bold text-ink cursor-pointer"
                  on:click={() => downloadTicket(guest)}
                >
                  Download
                </button>
                <span class="text-[#6b6b6b]" aria-hidden="true">·</span>
                <button
                  type="button"
                  class="border-0 bg-transparent p-0 font-bold text-ink cursor-pointer"
                  on:click={() => shareTicket(guest)}
                >
                  Share
                </button>
              </div>
            {/if}
          </div>
        {/each}
      {/if}

      <!-- Mobile pagination -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-paper-border bg-[#faf8f5] px-4 py-3"
      >
        <p class="m-0 text-[13px] text-ink-secondary">
          Showing {filtered.length === 0
            ? 0
            : pageIndex * pageSize + 1}–{Math.min(
            (pageIndex + 1) * pageSize,
            filtered.length
          )} of {filtered.length} guests
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#64748b] cursor-pointer disabled:opacity-40"
            disabled={pageIndex === 0}
            on:click={() => (pageIndex = Math.max(0, pageIndex - 1))}
          >
            Previous
          </button>
          <div class="flex items-center gap-1">
            {#each pageChips as p}
              <button
                type="button"
                class="min-w-[36px] rounded-lg px-3 py-2 text-[13px] cursor-pointer
                  {p === pageIndex
                  ? 'bg-brand font-bold text-white border-0'
                  : 'border border-[#e2e8f0] bg-white font-semibold text-ink'}"
                on:click={() => (pageIndex = p)}
              >
                {p + 1}
              </button>
            {/each}
          </div>
          <button
            type="button"
            class="rounded-lg px-3.5 py-2 text-[13px] font-semibold cursor-pointer disabled:opacity-40
              {pageIndex >= totalPages - 1
              ? 'border border-[#e2e8f0] bg-white text-[#64748b]'
              : 'border-0 bg-brand text-white'}"
            disabled={pageIndex >= totalPages - 1}
            on:click={() =>
              (pageIndex = Math.min(totalPages - 1, pageIndex + 1))}
          >
            Next
          </button>
        </div>
      </div>
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
                    <span
                      class="inline-flex rounded px-2.5 py-1 text-[11px] font-extrabold
                        {statusClass(guest.status)}"
                    >
                      {statusLabel(guest.status)}
                    </span>
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
                          class="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1.5 text-[12px] font-bold text-ink cursor-pointer hover:bg-white"
                          on:click={() => downloadTicket(guest)}
                        >
                          Download
                        </button>
                        <span class="text-[12px] text-[#e2e8f0]" aria-hidden="true"
                          >|</span
                        >
                        <button
                          type="button"
                          class="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1.5 text-[12px] font-bold text-ink cursor-pointer hover:bg-white"
                          on:click={() => shareTicket(guest)}
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

      <div
        class="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] bg-[#faf8f5] px-4 py-3"
      >
        <p class="m-0 text-[13px] text-ink-secondary">
          Showing {filtered.length === 0
            ? 0
            : pageIndex * pageSize + 1}–{Math.min(
            (pageIndex + 1) * pageSize,
            filtered.length
          )} of {filtered.length} guests
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#64748b] cursor-pointer disabled:opacity-40"
            disabled={pageIndex === 0}
            on:click={() => (pageIndex = Math.max(0, pageIndex - 1))}
          >
            Previous
          </button>
          <div class="flex items-center gap-1">
            {#each pageChips as p}
              <button
                type="button"
                class="min-w-[36px] rounded-lg px-3 py-2 text-[13px] cursor-pointer
                  {p === pageIndex
                  ? 'bg-brand font-bold text-white border-0'
                  : 'border border-[#e2e8f0] bg-white font-semibold text-ink'}"
                on:click={() => (pageIndex = p)}
              >
                {p + 1}
              </button>
            {/each}
          </div>
          <button
            type="button"
            class="rounded-lg px-3.5 py-2 text-[13px] font-semibold cursor-pointer disabled:opacity-40
              {pageIndex >= totalPages - 1
              ? 'border border-[#e2e8f0] bg-white text-[#64748b]'
              : 'border-0 bg-brand text-white'}"
            disabled={pageIndex >= totalPages - 1}
            on:click={() =>
              (pageIndex = Math.min(totalPages - 1, pageIndex + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>

  <EntryQrOverlay bind:this={overlay} bind:open={qrOpen} {event} guest={qrGuest} />
{/if}
