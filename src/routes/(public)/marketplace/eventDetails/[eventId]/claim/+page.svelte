<script>
  // @ts-nocheck
  /**
   * Marketplace free claim — mobile 249:58 / desktop 530:108.
   */
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { claimFreeTickets } from "$lib/supabase";
  import { showToast } from "$lib/store";
  import AuthPanelDecor from "$lib/components/auth/AuthPanelDecor.svelte";
  import CheckoutEventHero from "$lib/components/checkout/CheckoutEventHero.svelte";
  import FreeClaimCard from "$lib/components/public/FreeClaimCard.svelte";

  const STORAGE_KEY = "sos_free_claim";

  export let data;

  $: eventId = $page.params.eventId;
  $: event = data?.event || null;
  $: ticketTypes = data?.ticketTypes || [];

  let selectedTickets = {};
  let ready = false;
  let fullName = "";
  let claiming = false;

  $: heroDateTime = formatHeroDateTime(event?.dateRaw, event?.time);
  $: heroVenue = (event?.location || event?.venue || "").trim();
  $: badgeInfo = buildBadgeInfo(selectedTickets, ticketTypes);

  function formatHeroDateTime(date, time) {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return String(date);
    const datePart = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!time) return datePart;
    try {
      const iso = `${date}T${time.length === 5 ? `${time}:00` : time}`;
      const t = new Date(iso);
      if (!Number.isNaN(t.getTime())) {
        const timePart = t.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
        return `${datePart} · ${timePart}`;
      }
    } catch {
      /* ignore */
    }
    return `${datePart} · ${time}`;
  }

  function bounceToEvent() {
    goto(`/marketplace/eventDetails/${eventId}`);
  }

  function buildBadgeInfo(selection, types) {
    const selected = types.filter((t) => (selection[t.id] || 0) > 0);
    if (selected.length === 0) return { label: "", qty: 0 };
    const totalQty = selected.reduce(
      (sum, t) => sum + (selection[t.id] || 0),
      0
    );
    if (selected.length === 1) {
      return { label: selected[0].name, qty: totalQty };
    }
    return { label: `${selected.length} types`, qty: totalQty };
  }

  function isFreeOnlySelection(selection, types) {
    let freeQty = 0;
    let paidQty = 0;
    for (const t of types) {
      const qty = selection[t.id] || 0;
      if (qty <= 0) continue;
      if (t.price > 0) paidQty += qty;
      else freeQty += qty;
    }
    return freeQty > 0 && paidQty === 0;
  }

  onMount(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        bounceToEvent();
        return;
      }
      const parsed = JSON.parse(raw);
      if (
        !parsed ||
        parsed.eventId !== eventId ||
        !parsed.selectedTickets ||
        typeof parsed.selectedTickets !== "object"
      ) {
        sessionStorage.removeItem(STORAGE_KEY);
        bounceToEvent();
        return;
      }

      selectedTickets = parsed.selectedTickets;
      if (!isFreeOnlySelection(selectedTickets, ticketTypes)) {
        sessionStorage.removeItem(STORAGE_KEY);
        bounceToEvent();
        return;
      }

      ready = true;
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      bounceToEvent();
    }
  });

  async function handleClaim() {
    if (claiming || !event) return;
    claiming = true;
    try {
      showToast("info", "Processing Claim", "Creating your free tickets…");
      const result = await claimFreeTickets(event.id, selectedTickets, {
        id: null,
        email: null,
        wallet_address: null,
        name: fullName.trim() || "Anonymous",
      });

      if (result.success && result.orderId) {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        showToast(
          "success",
          "Free Tickets Claimed",
          `Successfully claimed ${result.ticketsClaimed} ticket(s)!`
        );
        goto(`/tickets/confirmation/${result.orderId}`);
      } else {
        throw new Error(result.error || "Failed to claim tickets");
      }
    } catch (err) {
      showToast(
        "error",
        "Claim Failed",
        `Failed to claim tickets: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      claiming = false;
    }
  }
</script>

<svelte:head>
  <title
    >{event?.name
      ? `Claim · ${event.name} · SOS SEATS`
      : "Claim Ticket · SOS SEATS"}</title
  >
</svelte:head>

{#if !event}
  <div class="flex min-h-screen items-center justify-center bg-paper p-8">
    <div class="max-w-md rounded-2xl border border-paper-border bg-white p-8 text-center">
      <h1 class="m-0 text-xl font-bold text-ink">Claim unavailable</h1>
      <p class="mt-2 text-sm text-ink-secondary">This event was not found.</p>
      <a
        href="/marketplace"
        class="mt-6 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white no-underline"
      >
        Back to Marketplace
      </a>
    </div>
  </div>
{:else if ready}
  <div class="flex min-h-screen flex-col bg-[#faf8f5] lg:flex-row lg:bg-transparent">
    <div class="hidden lg:contents">
      <CheckoutEventHero
        badge="FREE TICKET EVENT"
        title={event.name}
        date={heroDateTime}
        location={heroVenue}
        image={event.image}
      />
    </div>

    <div
      class="relative flex flex-1 flex-col items-stretch overflow-hidden px-0 lg:w-1/2 lg:items-center lg:justify-center lg:bg-paper lg:px-8 lg:py-6"
    >
      <div
        class="pointer-events-none absolute inset-0 hidden lg:block"
        aria-hidden="true"
      >
        <AuthPanelDecor />
      </div>

      <div
        class="relative z-10 flex w-full items-center justify-between px-5 py-3 lg:hidden"
      >
        <h1 class="m-0 text-xl font-extrabold text-ink">Claim Ticket</h1>
        <span
          class="inline-flex items-center gap-2 rounded-full border border-paper-border bg-white px-2.5 py-1.5"
        >
          <span class="size-2 shrink-0 rounded bg-brand" aria-hidden="true"></span>
          <span class="text-[11px] font-bold text-brand">STEP 1 OF 1</span>
        </span>
      </div>

      <div class="relative z-10 w-full px-5 pb-5 pt-4 lg:max-w-[440px] lg:px-0 lg:py-0">
        <FreeClaimCard
          eventName={event.name}
          ticketTypeLabel={badgeInfo.label}
          ticketQty={badgeInfo.qty}
          bind:fullName
          loading={claiming}
          onClaim={handleClaim}
        />
      </div>
    </div>
  </div>
{/if}
