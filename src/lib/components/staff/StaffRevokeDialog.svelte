<script>
  // @ts-nocheck
  /**
   * Revoke staff access confirm (HI-FI 1540:5859 desktop, 1540:5966 mobile).
   * Posts to /api/staff/{id}/revoke. Dispatches `close` and `revoked`.
   */
  import { createEventDispatcher } from "svelte";
  import UserX from "lucide-svelte/icons/user-x";
  import StaffDialog from "./StaffDialog.svelte";
  import StaffNotice from "./StaffNotice.svelte";
  import { staffContactLabel } from "./staffFormat.js";

  /** @type {{ id: string, type: "email" | "phone", contact: string } | null} */
  export let staff = null;

  const OFFLINE_COPY = "Couldn't reach SOS SEATS. Check your connection and try again.";

  const dispatch = createEventDispatcher();

  let lastId = null;
  let notice = "";
  let busy = false;

  $: if ((staff?.id || null) !== lastId) {
    lastId = staff?.id || null;
    notice = "";
  }

  $: revokeLabel = busy ? "Revoking..." : "Revoke";

  function close() {
    if (!busy) dispatch("close");
  }

  async function revoke() {
    if (!staff || busy) return;
    busy = true;
    notice = "";
    try {
      const res = await fetch(`/api/staff/${staff.id}/revoke`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        notice = body.error || "Something went wrong. Try again.";
        return;
      }
      dispatch("revoked", staff);
    } catch {
      notice = OFFLINE_COPY;
    } finally {
      busy = false;
    }
  }
</script>

<StaffDialog open={!!staff} variant="center" labelledby="staff-revoke-title" on:close={close}>
  {#if staff}
    <div class="flex w-full flex-col items-center gap-2 text-center lg:gap-4">
      <div
        class="flex size-12 items-center justify-center rounded-full bg-red-100 text-red-500 lg:size-14"
        aria-hidden="true"
      >
        <UserX size={22} strokeWidth={2} class="lg:hidden" />
        <UserX size={24} strokeWidth={2} class="hidden lg:block" />
      </div>
      <div class="flex w-full flex-col items-center gap-2">
        <h2
          id="staff-revoke-title"
          class="m-0 font-display text-xl font-bold text-ink lg:font-public lg:font-extrabold"
        >
          Revoke staff access?
        </h2>
        <p class="m-0 text-sm leading-[1.4] text-ink-secondary lg:leading-5">
          {staffContactLabel(staff)} will lose access to your events right away. This can't be undone.
          Invite them again to restore access.
        </p>
      </div>
    </div>

    {#if notice}
      <StaffNotice tone="error">{notice}</StaffNotice>
    {/if}

    <div class="flex w-full flex-col gap-2.5 lg:hidden">
      <button
        type="button"
        class="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border-0 bg-red-500 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-[0.45]"
        disabled={busy}
        on:click={revoke}
      >
        {revokeLabel}
      </button>
      <button
        type="button"
        class="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-paper-border bg-white text-sm font-bold text-ink-secondary hover:bg-paper-cream disabled:cursor-not-allowed disabled:opacity-[0.45]"
        disabled={busy}
        on:click={close}
      >
        Cancel
      </button>
    </div>

    <div class="hidden w-full gap-3 lg:flex">
      <button
        type="button"
        class="flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-lg border-[1.5px] border-paper-border bg-white text-[15px] font-bold text-ink-secondary hover:bg-paper-cream disabled:cursor-not-allowed disabled:opacity-[0.45]"
        disabled={busy}
        on:click={close}
      >
        Cancel
      </button>
      <button
        type="button"
        class="flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-lg border-0 bg-red-500 text-[15px] font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-[0.45]"
        disabled={busy}
        on:click={revoke}
      >
        {revokeLabel}
      </button>
    </div>
  {/if}
</StaffDialog>
