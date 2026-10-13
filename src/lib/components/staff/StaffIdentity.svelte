<script>
  // @ts-nocheck
  /**
   * Staff avatar, contact and added date (HI-FI 115:88 card, 1540:5703 edit top row).
   */
  import Mail from "lucide-svelte/icons/mail";
  import Phone from "lucide-svelte/icons/phone";
  import { formatAddedDate, staffContactLabel } from "./staffFormat.js";

  /** @type {{ type: "email" | "phone", contact: string, createdAt: string }} */
  export let staff;

  $: label = staffContactLabel(staff);
</script>

<div class="flex w-full items-center gap-3">
  <div
    class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"
    aria-hidden="true"
  >
    {#if staff.type === "phone"}
      <Phone size={20} strokeWidth={2} />
    {:else}
      <Mail size={20} strokeWidth={2} />
    {/if}
  </div>
  <div class="flex min-w-0 flex-1 flex-col gap-1">
    <p class="m-0 truncate text-sm font-extrabold text-ink" title={label}>{label}</p>
    <p class="m-0 text-xs text-ink-secondary">Added {formatAddedDate(staff.createdAt)}</p>
  </div>
</div>
