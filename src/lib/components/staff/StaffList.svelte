<script>
  // @ts-nocheck
  /**
   * Existing door staff (HI-FI 55:2121 desktop, 36:784 mobile, empty 1540:5019 / 1540:5226).
   * Forwards `edit` and `revoke` from each card.
   */
  import Search from "lucide-svelte/icons/search";
  import PublicEmptyStage from "$lib/components/public/PublicEmptyStage.svelte";
  import StaffCard from "./StaffCard.svelte";
  import { staffContactLabel } from "./staffFormat.js";

  /** @type {{ id: string, type: "email" | "phone", contact: string, createdAt: string, events: { id: string, name: string }[] }[]} */
  export let staff = [];
  /** Card to outline in green after an already-your-staff invite (1540:4589). */
  export let highlightId = null;

  let query = "";

  $: needle = query.trim().toLowerCase();
  $: shown = needle
    ? staff.filter(
        (s) =>
          s.contact.toLowerCase().includes(needle) ||
          staffContactLabel(s).toLowerCase().includes(needle) ||
          s.events.some((e) => e.name.toLowerCase().includes(needle))
      )
    : staff;
</script>

<section class="flex w-full flex-col gap-3 lg:gap-4" aria-labelledby="staff-list-title">
  <div class="flex flex-col gap-1.5">
    <h2 id="staff-list-title" class="m-0 text-base font-extrabold text-ink lg:text-lg">
      <span class="lg:hidden">Active Door Staff ({staff.length})</span>
      <span class="hidden lg:inline">Existing Door Staff ({staff.length})</span>
    </h2>
    <p class="m-0 hidden text-[13px] leading-normal text-ink-body lg:block">
      Manage event access and passwords. Revoking access is permanent.
    </p>
  </div>

  {#if staff.length === 0}
    <div
      class="flex w-full flex-col items-center gap-5 overflow-hidden rounded-[20px] border border-paper-border bg-[#faf9f7] px-5 py-2"
    >
      <div class="flex w-full justify-center lg:hidden">
        <!-- Mobile 1540:5067: 310 by 320, taller than the stage's default 310/280 -->
        <PublicEmptyStage variant="mobile" className="w-full max-w-[310px] !aspect-[310/320]" />
      </div>
      <!-- Desktop 1540:5226: full 520px stage, clipped at the sides by this box -->
      <div class="hidden w-[520px] shrink-0 lg:block">
        <PublicEmptyStage />
      </div>
      <div class="flex w-full flex-col gap-2 text-center">
        <p class="m-0 font-display text-xl font-bold leading-normal text-[#0f1729]">
          No door staff yet
        </p>
        <p class="m-0 text-sm leading-[1.5] text-[#6b5f78]">
          Staff you add will appear here. You can edit their events or revoke access at any time.
        </p>
      </div>
    </div>
  {:else}
    <label
      class="hidden h-11 w-full items-center gap-2.5 rounded-[10px] border border-paper-border bg-white px-3 focus-within:border-brand lg:flex"
    >
      <Search size={18} strokeWidth={2} class="shrink-0 text-ink-muted" aria-hidden="true" />
      <span class="sr-only">Search staff</span>
      <input
        type="search"
        bind:value={query}
        placeholder="Search staff..."
        class="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-0"
      />
    </label>

    {#if shown.length === 0}
      <p class="m-0 py-4 text-center text-[13px] text-ink-secondary">
        No staff match "{query.trim()}".
      </p>
    {:else}
      <div class="flex w-full flex-col gap-2 lg:gap-3">
        {#each shown as member (member.id)}
          <StaffCard staff={member} highlight={member.id === highlightId} on:edit on:revoke />
        {/each}
      </div>
    {/if}
  {/if}
</section>
