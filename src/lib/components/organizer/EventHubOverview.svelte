<script>
  // @ts-nocheck
  /** Overview panel — desktop HI-FI 199:56 / mobile HI-FI 208:58. */
  import Users from "lucide-svelte/icons/users";
  import BadgeCheck from "lucide-svelte/icons/badge-check";
  import Ticket from "lucide-svelte/icons/ticket";
  import Info from "lucide-svelte/icons/info";
  import {
    calculateOrganiserPlatformFee,
    formatPlatformFeePercent,
  } from "$lib/fees";

  /** @type {any} */
  export let event = null;

  const BAR_COLORS = ["#ff5a1f", "#d97706", "#7c3aed", "#10b981"];

  $: guests = Array.isArray(event?.guests) ? event.guests : [];
  $: guestCount = guests.length;
  $: checkedIn = guests.filter((g) => {
    const s = String(g.status || "").toLowerCase();
    return s === "checked_in" || s === "checked-in";
  }).length;
  $: checkInRate =
    guestCount > 0 ? Math.round((checkedIn / guestCount) * 100) : 0;
  $: privateIssued = guests.filter((g) => {
    const status = String(g.status || "").toLowerCase();
    const type = String(g.ticketType || "").toLowerCase();
    return (
      status === "issued" ||
      type === "private invite" ||
      g.specialRequirements === "private_issue"
    );
  }).length;

  $: salesTypes = (
    Array.isArray(event?.ticketTypes) ? event.ticketTypes : []
  ).filter((t) => String(t.name || "").toLowerCase() !== "private invite");

  $: totalRevenue = Number(event?.totalRevenue) || 0;
  $: platformFee = calculateOrganiserPlatformFee(totalRevenue);
  $: netProceeds = Math.round((totalRevenue - platformFee) * 100) / 100;
  $: platformFeeLabel = formatPlatformFeePercent();

  function formatNle(amount) {
    const n = Number(amount) || 0;
    const whole = Number.isInteger(n) || Math.abs(n - Math.round(n)) < 0.001;
    return `NLe ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(n)}`;
  }

  function barPct(sold, quantity) {
    const q = Number(quantity) || 0;
    const s = Number(sold) || 0;
    if (q <= 0) return 0;
    return Math.min(100, Math.round((s / q) * 100));
  }
</script>

{#if event}
  <div class="flex flex-col gap-6 lg:gap-8">
    <!-- Stats: mobile 2+1 label-first (208:58); desktop 3-up number+icon (199:56) -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-4">
      <div
        class="flex items-center gap-4 rounded-2xl border border-paper-border bg-[#fff4ed] p-4 shadow-sm lg:h-[132px] lg:p-5"
      >
        <span
          class="self-stretch w-1.5 shrink-0 rounded bg-brand"
          aria-hidden="true"
        ></span>
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <p
            class="m-0 text-[13px] font-bold leading-snug text-[#666673] lg:hidden"
          >
            Total Guests Registered
          </p>
          <div class="flex items-center gap-2.5">
            <Users
              size={24}
              class="hidden shrink-0 text-brand lg:block"
              aria-hidden="true"
            />
            <p class="m-0 text-[32px] font-extrabold leading-none text-brand">
              {guestCount}
            </p>
          </div>
          <p
            class="m-0 hidden text-xs font-bold uppercase tracking-[0.8px] text-[#666673] lg:block"
          >
            Total Guests Registered
          </p>
          <p class="m-0 text-[13px] font-semibold text-ink-secondary lg:text-[13px]">
            Capacity: {event.totalCapacity || 0}
          </p>
        </div>
      </div>

      <div
        class="flex items-center gap-4 rounded-2xl border border-paper-border bg-[#ecfdf5] p-4 shadow-sm lg:h-[132px] lg:p-5"
      >
        <span
          class="self-stretch w-1.5 shrink-0 rounded bg-[#00e676]"
          aria-hidden="true"
        ></span>
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <p
            class="m-0 text-[13px] font-bold leading-snug text-[#666673] lg:hidden"
          >
            Check-in Rate
          </p>
          <div class="flex items-center gap-2.5">
            <BadgeCheck
              size={24}
              class="hidden shrink-0 text-[#16a34a] lg:block"
              aria-hidden="true"
            />
            <p
              class="m-0 text-[32px] font-extrabold leading-none text-[#16a34a]"
            >
              {checkInRate}%
            </p>
          </div>
          <p
            class="m-0 hidden text-xs font-bold uppercase tracking-[0.8px] text-[#666673] lg:block"
          >
            Checked-in Rate
          </p>
          <p class="m-0 text-[13px] font-semibold text-ink-secondary">
            {checkedIn} guests arrived
          </p>
        </div>
      </div>

      <div
        class="col-span-2 flex items-center gap-4 rounded-2xl border border-paper-border bg-[#f0f9ff] p-4 shadow-sm lg:col-span-1 lg:h-[132px] lg:p-5"
      >
        <span
          class="self-stretch w-1.5 shrink-0 rounded bg-[#3b82d9]"
          aria-hidden="true"
        ></span>
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <p
            class="m-0 text-[13px] font-bold leading-snug text-[#666673] lg:hidden"
          >
            Private Issued
          </p>
          <div class="flex items-center gap-2.5">
            <Ticket
              size={24}
              class="hidden shrink-0 text-[#3b82d9] lg:block"
              aria-hidden="true"
            />
            <p
              class="m-0 text-[32px] font-extrabold leading-none text-[#3b82d9]"
            >
              {privateIssued}
            </p>
          </div>
          <p
            class="m-0 hidden text-xs font-bold uppercase tracking-[0.8px] text-[#666673] lg:block"
          >
            Private Issued
          </p>
          <p class="m-0 text-[13px] font-semibold text-ink-secondary">
            Staff list &amp; patrons
          </p>
        </div>
      </div>
    </div>

    <!-- Sales + Revenue -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
      <section
        class="flex min-w-0 flex-1 flex-col gap-5 rounded-2xl border border-paper-border bg-paper p-5 shadow-sm lg:p-6"
      >
        <h3 class="m-0 text-lg font-extrabold text-ink">
          Ticket Sales Summary
        </h3>
        {#if salesTypes.length === 0}
          <p class="m-0 text-sm text-ink-secondary">No ticket types yet.</p>
        {:else}
          <div class="flex flex-col gap-4">
            {#each salesTypes as t, i}
              {@const color = BAR_COLORS[i % BAR_COLORS.length]}
              {@const pct = barPct(t.sold, t.quantity)}
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-3 lg:hidden">
                  <span
                    class="size-2 shrink-0 rounded-full"
                    style="background-color: {color}"
                    aria-hidden="true"
                  ></span>
                  <p class="m-0 text-sm font-bold text-slate-public">
                    {t.name || "Ticket"}
                  </p>
                </div>
                <div
                  class="hidden items-center justify-between gap-3 text-sm lg:flex"
                >
                  <p class="m-0 font-extrabold" style="color: {color}">
                    {t.name || "Ticket"}
                  </p>
                  <p class="m-0 shrink-0 font-semibold text-ink-secondary">
                    {t.sold || 0} / {t.quantity || 0} sold
                  </p>
                </div>
                <div
                  class="h-2 w-full overflow-hidden rounded-md bg-paper-border lg:h-2.5"
                >
                  <div
                    class="h-full rounded-md transition-all"
                    style="width: {pct}%; background-color: {color}"
                  ></div>
                </div>
                <p class="m-0 text-sm font-semibold text-[#64748b] lg:hidden">
                  {t.sold || 0} / {t.quantity || 0} sold
                </p>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <section
        class="flex w-full shrink-0 flex-col gap-5 rounded-2xl border border-paper-border bg-paper p-5 shadow-sm lg:w-[450px] lg:p-6"
      >
        <h3 class="m-0 text-lg font-extrabold text-ink">Revenue Summary</h3>
        <div
          class="flex flex-col gap-4 rounded-xl border border-[#ffe9d2] bg-[#fffdf9] p-5"
        >
          <div class="flex flex-col gap-1.5">
            <p class="m-0 text-[13px] font-semibold text-ink-secondary">
              Total Revenue Generated
            </p>
            <p class="m-0 text-[40px] font-extrabold leading-none text-brand">
              {formatNle(totalRevenue)}
            </p>
          </div>
          <div class="h-px w-full bg-paper-border"></div>
          <div class="flex items-center justify-between gap-3 text-[13px]">
            <span class="font-medium text-ink-secondary"
              >Platform Organiser Fee ({platformFeeLabel})</span
            >
            <span class="font-bold text-ink">{formatNle(platformFee)}</span>
          </div>
          <div class="h-px w-full bg-paper-border"></div>
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-extrabold text-ink"
              >Net Expected Proceeds</span
            >
            <span class="text-lg font-extrabold text-[#10b981]"
              >{formatNle(netProceeds)}</span
            >
          </div>
        </div>
        <div
          class="flex items-center gap-2.5 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] p-3"
        >
          <Info
            size={16}
            class="shrink-0 text-[#1e40af]"
            aria-hidden="true"
          />
          <p class="m-0 text-[13px] font-semibold text-[#1e40af]">
            Proceeds settle after event completion and verification.
          </p>
        </div>
      </section>
    </div>
  </div>
{/if}
