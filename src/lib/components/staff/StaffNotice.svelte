<script>
  // @ts-nocheck
  /**
   * Invite Staff notices. info: no-email/SMS callout (115:52 desktop, 36:782 mobile amber).
   * error: contact in use or server error (1540:4280 desktop, 1540:4190 mobile).
   * success: already your staff (1540:4526 desktop, 1540:4434 mobile).
   */
  import Info from "lucide-svelte/icons/info";

  /** `"info"` | `"error"` | `"success"` */
  export let tone = "info";

  const tones = {
    info: {
      box: "border-[#ffebaa] bg-[#fff9eb] text-[#8a6d3b] lg:border-brand/10 lg:bg-brand/5 lg:text-ink-body",
      icon: "hidden text-brand lg:block",
    },
    error: {
      box: "border-red-500/35 bg-red-500/[0.08] text-red-700",
      icon: "hidden text-red-500 lg:block",
    },
    success: {
      box: "border-green-600/35 bg-green-600/[0.08] text-green-700",
      icon: "hidden text-green-600 lg:block",
    },
  };

  $: style = tones[tone] || tones.info;
</script>

<div
  class="flex w-full items-start gap-3 rounded-lg border p-3 lg:items-center {style.box}"
  role={tone === "error" ? "alert" : "status"}
>
  <Info size={18} strokeWidth={2} class="shrink-0 {style.icon}" aria-hidden="true" />
  <p class="m-0 flex-1 text-xs leading-[1.4] lg:leading-[1.5]">
    <slot />
  </p>
</div>
