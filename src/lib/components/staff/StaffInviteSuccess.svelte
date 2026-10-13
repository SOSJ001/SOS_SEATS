<script>
  // @ts-nocheck
  /**
   * Staff Account Created (HI-FI 1540:4684 desktop, 1540:4891 mobile).
   * The password is never shown back.
   */
  import { createEventDispatcher } from "svelte";
  import Check from "lucide-svelte/icons/check";
  import StaffNotice from "./StaffNotice.svelte";

  export let contact = "";
  /** @type {{ name: string }[]} */
  export let events = [];

  const dispatch = createEventDispatcher();

  $: rows = [
    { label: "Contact", value: contact },
    { label: "Password", value: "The one you set (not shown again)" },
    { label: "Sign in at", value: "Sign in, then Staff", strong: true },
    {
      label: "Assigned events",
      mobileLabel: "Events",
      value: events.map((e) => e.name).join(", "),
    },
  ];

  const button =
    "cursor-pointer rounded-xl px-6 py-4 text-[15px] font-bold leading-normal lg:h-10 lg:px-3 lg:py-0 lg:text-[13px]";
</script>

<div class="flex w-full flex-col gap-4">
  <div class="flex w-full flex-col items-center gap-6 text-center lg:gap-4">
    <div
      class="flex size-24 items-center justify-center rounded-full border-2 border-green-500 bg-accent-green-soft shadow-[0_0_12px_rgba(34,197,94,0.12)] lg:size-16"
      aria-hidden="true"
    >
      <div
        class="flex size-20 items-center justify-center rounded-full border-2 border-green-500 bg-white text-green-500 lg:size-[52px]"
      >
        <Check size={32} strokeWidth={2.5} class="lg:size-6" />
      </div>
    </div>

    <div class="flex w-full flex-col gap-2">
      <h2 class="m-0 text-2xl font-extrabold text-ink">Staff Account Created</h2>
      <p class="m-0 text-[15px] font-medium text-ink-secondary lg:text-sm">
        Share these login details with your staff member.
      </p>
    </div>

    <div
      class="flex w-full items-center gap-3 rounded-2xl border border-green-500 bg-accent-green-soft p-4 text-left"
    >
      <span
        class="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-500/[0.12] text-green-500"
        aria-hidden="true"
      >
        <Check size={16} strokeWidth={3} />
      </span>
      <p class="m-0 flex-1 text-sm font-bold text-ink">
        They can now sign in and scan their assigned events.
      </p>
    </div>
  </div>

  <div
    class="flex w-full flex-col gap-4 rounded-2xl border-[1.5px] border-paper-border bg-white p-8 shadow-[0px_8px_12px_rgba(18,4,28,0.04)] lg:gap-3 lg:p-4"
  >
    <h3 class="m-0 text-base font-extrabold text-ink">Login Details</h3>
    <dl class="m-0 flex flex-col gap-4 lg:gap-3">
      {#each rows as row}
        <div
          class="flex items-center justify-between gap-4 border-t border-paper-border pt-4 lg:pt-3"
        >
          <dt class="shrink-0 text-[13px] text-ink-secondary">
            {#if row.mobileLabel}
              <span class="lg:hidden">{row.mobileLabel}</span>
              <span class="hidden lg:inline">{row.label}</span>
            {:else}
              {row.label}
            {/if}
          </dt>
          <dd
            class="m-0 min-w-0 break-words text-right text-[13px] text-ink {row.strong
              ? 'font-extrabold'
              : 'font-bold'}"
          >
            {row.value}
          </dd>
        </div>
      {/each}
    </dl>
  </div>

  <div class="grid w-full grid-cols-2 gap-4 lg:gap-3">
    <button
      type="button"
      class="{button} border-0 bg-brand text-white shadow-[0px_8px_10px_rgba(255,90,31,0.15)] hover:brightness-105"
      on:click={() => dispatch("again")}
    >
      Invite Another
    </button>
    <button
      type="button"
      class="{button} border-2 border-brand bg-white text-brand hover:bg-brand/5"
      on:click={() => dispatch("done")}
    >
      Done
    </button>
  </div>

  <StaffNotice tone="info">
    SOS SEATS does not send email or SMS. Share these details yourself.
  </StaffNotice>
</div>
