<script>
  // @ts-nocheck
  /**
   * Scan result (roadmap 7.2).
   * part "hero": desktop viewfinder result (55:2275 valid, 55:2303 invalid).
   * part "details": desktop Ticket Details card.
   * part "mobile": stacked mobile result (440:127 checked in, 440:100 invalid).
   */
  import Check from "lucide-svelte/icons/check";
  import X from "lucide-svelte/icons/x";
  import { formatCheckedInAt } from "./doorFormat.js";

  /** From toScanResult(): { kind, code, headline, message, ticket, checkedInAt } */
  export let result;
  export let part = "hero";

  $: ok = result?.kind === "valid" || result?.kind === "checked_in";
  $: ticket = result?.ticket || null;
  $: rows = ticket
    ? [
        { label: "Attendee Name", value: ticket.holderName || "-" },
        { label: "Ticket Class", value: ticket.ticketType || "-" },
        ...(result?.code === "already_checked_in"
          ? [{ label: "Checked-In Timestamp", value: formatCheckedInAt(result.checkedInAt), accent: true }]
          : []),
        { label: "Ticket Number", value: ticket.ticketNumber || "-", mono: true },
      ]
    : [];
</script>

{#if result}
  {#if part === "hero"}
    <div class="flex flex-col items-center gap-4 px-8 text-center" role="status" aria-live="polite">
      <span
        class="flex size-28 items-center justify-center rounded-full {ok
          ? 'bg-[#00e676] shadow-[0_0_32px_rgba(0,230,118,0.45)]'
          : 'bg-[#ef4444] shadow-[0_0_32px_rgba(239,68,68,0.4)]'}"
        aria-hidden="true"
      >
        <svelte:component this={ok ? Check : X} class="size-14 text-ink" strokeWidth={3} />
      </span>
      <div class="flex flex-col gap-2">
        <p
          class="m-0 text-2xl font-extrabold leading-tight {result.kind === 'checked_in'
            ? 'text-[#16a34a]'
            : 'text-ink'}"
        >
          {result.headline}
        </p>
        <p class="m-0 max-w-sm text-sm text-ink opacity-70">{result.message}</p>
      </div>
    </div>
  {:else if part === "details"}
    {#if rows.length}
      <div class="flex flex-col gap-3 rounded-2xl border border-paper-border bg-[#f8f5f2] p-4">
        <h2 class="m-0 text-base font-extrabold text-ink">Ticket Details</h2>
        <dl class="m-0 flex flex-col gap-2.5">
          {#each rows as row, i (row.label)}
            <div
              class="flex items-center justify-between gap-4 text-sm {i < rows.length - 1
                ? 'border-b border-paper-border pb-2.5'
                : ''}"
            >
              <dt class="font-medium text-ink-secondary">{row.label}</dt>
              <dd
                class="m-0 min-w-0 truncate text-right font-bold {row.accent ? 'text-brand' : 'text-ink'} {row.mono
                  ? 'font-mono'
                  : ''}"
              >
                {row.value}
              </dd>
            </div>
          {/each}
        </dl>
      </div>
    {/if}
  {:else}
    <div class="flex flex-col gap-4" role="status" aria-live="polite">
      {#if ok}
        <div
          class="flex flex-col items-center gap-3 rounded-2xl border border-[#a7f3d0] bg-accent-green-soft p-4 text-center"
        >
          <span class="flex size-20 items-center justify-center rounded-full bg-[#22c55e]" aria-hidden="true">
            <Check class="size-10 text-white" strokeWidth={3} />
          </span>
          <p class="m-0 text-2xl font-extrabold text-[#16a34a]">{result.headline}</p>
          <p class="m-0 text-sm text-ink-secondary">{result.message}</p>
        </div>
      {:else}
        <div class="flex flex-col items-center gap-3 px-2 text-center">
          <span class="flex size-24 items-center justify-center rounded-full bg-[#ef4444]" aria-hidden="true">
            <X class="size-12 text-white" strokeWidth={3} />
          </span>
          <p class="m-0 text-2xl font-extrabold text-[#ef4444]">{result.headline}</p>
          <p class="m-0 text-[15px] font-medium text-ink-secondary">{result.message}</p>
        </div>
      {/if}

      {#if rows.length}
        <dl
          class="relative m-0 flex flex-col gap-2.5 overflow-hidden rounded-2xl border p-4 {ok
            ? 'border-paper-border bg-[#f8f5f2]'
            : 'border-[#fecaca] bg-[#fff7ed] pt-5'}"
        >
          {#if !ok}
            <span class="absolute inset-x-0 top-0 h-1 bg-[#ef4444]" aria-hidden="true"></span>
          {/if}
          {#each rows as row (row.label)}
            <div class="flex items-center justify-between gap-4 {ok ? 'text-sm' : 'text-[13px]'}">
              <dt class="font-medium text-ink-secondary {ok ? 'text-xs' : ''}">{row.label}</dt>
              <dd
                class="m-0 min-w-0 truncate text-right font-bold {row.accent ? 'text-brand' : 'text-ink'} {row.mono
                  ? 'font-mono'
                  : ''}"
              >
                {row.value}
              </dd>
            </div>
          {/each}
        </dl>
      {/if}
    </div>
  {/if}
{/if}
