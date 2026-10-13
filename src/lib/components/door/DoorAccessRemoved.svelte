<script>
  // @ts-nocheck
  /** Staff scanner after access is removed: mobile card 1540:7502 / desktop panel 1540:7547. */
  import ShieldOff from "lucide-svelte/icons/shield-off";

  /** "card" (mobile) | "panel" (desktop viewfinder) */
  export let variant = "card";
  export let backHref = "/dashboard/staff";
</script>

{#if variant === "panel"}
  <div class="flex flex-col items-center gap-4 px-8 text-center" role="alert">
    <span
      class="flex size-16 items-center justify-center rounded-full bg-[rgba(239,68,68,0.15)] text-[#ef4444]"
      aria-hidden="true"
    >
      <ShieldOff size={30} />
    </span>
    <p class="m-0 text-lg font-extrabold text-ink">You no longer have access to this event.</p>
    <p class="m-0 text-sm text-ink">Ask your organizer if you think this is a mistake.</p>
    <a
      href={backHref}
      class="inline-flex h-10 items-center justify-center rounded-xl bg-brand px-4 text-[13px] font-bold text-white no-underline shadow-[0_8px_8px_rgba(255,90,31,0.3)] hover:bg-[#e94d14]"
    >
      Back to my events
    </a>
  </div>
{:else}
  <div
    class="rounded-[20px] border border-paper-border bg-paper p-10 shadow-[0_12px_16px_rgba(18,4,28,0.12)]"
    role="alert"
  >
    <div class="flex flex-col items-center gap-4 text-center">
      <span
        class="flex size-14 items-center justify-center rounded-full bg-[#fee2e2] text-[#ef4444]"
        aria-hidden="true"
      >
        <ShieldOff size={26} />
      </span>
      <div class="flex flex-col gap-2">
        <p class="m-0 text-xl font-extrabold text-ink">Access removed</p>
        <p class="m-0 text-sm leading-5 text-ink-secondary">
          You no longer have access to this event. Ask your organizer if you think this is a
          mistake.
        </p>
      </div>
    </div>
  </div>
{/if}
