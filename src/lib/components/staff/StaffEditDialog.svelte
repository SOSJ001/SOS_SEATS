<script>
  // @ts-nocheck
  /**
   * Edit Door Staff (HI-FI 1540:5502 desktop modal, 1540:5701 mobile sheet).
   * Unassign, add events and set a new password. Dispatches `close`, `changed`
   * (after assign or unassign) and `revoke`.
   */
  import { createEventDispatcher } from "svelte";
  import X from "lucide-svelte/icons/x";
  import AppDialog from "$lib/components/authed/AppDialog.svelte";
  import StaffIdentity from "./StaffIdentity.svelte";
  import StaffEventPicker from "./StaffEventPicker.svelte";
  import StaffTextField from "./StaffTextField.svelte";
  import StaffNotice from "./StaffNotice.svelte";
  import { formatEventDateTime } from "$lib/components/door/doorFormat.js";

  /** @type {{ id: string, type: "email" | "phone", contact: string, createdAt: string, events: { id: string, name: string, date: string | null }[] } | null} */
  export let staff = null;
  /** @type {{ id: string, name: string, date: string | null }[]} */
  export let eligibleEvents = [];

  const PASSWORD_MIN = 8;
  const PASSWORD_COPY = `Password must be at least ${PASSWORD_MIN} characters.`;
  const OFFLINE_COPY = "Couldn't reach SOS SEATS. Check your connection and try again.";

  const dispatch = createEventDispatcher();

  let lastId = null;
  let selected = [];
  let password = "";
  let passwordError = "";
  let passwordSaved = false;
  /** @type {string} */
  let notice = "";
  let busy = false;

  $: if ((staff?.id || null) !== lastId) {
    lastId = staff?.id || null;
    selected = [];
    password = "";
    passwordError = "";
    passwordSaved = false;
    notice = "";
  }

  $: assigned = staff?.events || [];
  $: assignedIds = new Set(assigned.map((e) => e.id));
  $: addable = eligibleEvents.filter((e) => !assignedIds.has(e.id));
  $: addLabel = `Add ${selected.length} event${selected.length === 1 ? "" : "s"}`;
  const chip =
    "cursor-pointer rounded-md border-0 bg-brand/[0.08] px-2 py-1 text-[11px] font-extrabold text-brand hover:bg-brand/15 disabled:cursor-not-allowed disabled:opacity-[0.45]";

  async function call(url, method, payload) {
    busy = true;
    notice = "";
    try {
      const res = await fetch(url, {
        method,
        headers: payload ? { "Content-Type": "application/json" } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const body = await res.json().catch(() => ({}));
      return { ok: res.ok && !!body.success, body };
    } catch {
      return { ok: false, body: null };
    } finally {
      busy = false;
    }
  }

  function showFailure(body) {
    notice = body ? body.error || "Something went wrong. Try again." : OFFLINE_COPY;
  }

  async function unassign(event) {
    const { ok, body } = await call(`/api/staff/${staff.id}/events/${event.id}`, "DELETE");
    if (!ok) return showFailure(body);
    dispatch("changed");
  }

  async function addEvents() {
    if (selected.length === 0) return;
    const { ok, body } = await call(`/api/staff/${staff.id}/events`, "POST", {
      eventIds: selected,
    });
    if (!ok) return showFailure(body);
    selected = [];
    dispatch("changed");
  }

  async function savePassword() {
    passwordSaved = false;
    if (password.length < PASSWORD_MIN) {
      passwordError = PASSWORD_COPY;
      return;
    }
    const { ok, body } = await call(`/api/staff/${staff.id}/password`, "POST", { password });
    if (!ok) {
      if (body?.field === "password") passwordError = PASSWORD_COPY;
      else showFailure(body);
      return;
    }
    password = "";
    passwordSaved = true;
  }

  function onPasswordInput() {
    passwordError = "";
    passwordSaved = false;
  }
</script>

<AppDialog open={!!staff} labelledby="staff-edit-title" on:close>
  {#if staff}
    <h2 id="staff-edit-title" class="m-0 text-lg font-extrabold text-ink">Edit Door Staff</h2>

    <StaffIdentity {staff} />

    <p class="m-0 text-[13px] font-extrabold text-ink-secondary">Assigned events</p>
    <div class="flex w-full flex-col gap-3 rounded-xl border border-paper-border bg-paper-cream p-4">
      {#if assigned.length === 0}
        <p class="m-0 text-[13px] font-medium text-ink-muted">No events assigned</p>
      {:else}
        {#each assigned as event (event.id)}
          <div class="flex w-full items-center gap-2.5">
            <span class="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-body">
              {event.name}
            </span>
            <span class="shrink-0 text-[13px] font-medium text-ink-body">
              {formatEventDateTime(event.date, null)}
            </span>
            <button
              type="button"
              class="flex size-4 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-[0.45]"
              aria-label="Remove {event.name}"
              disabled={busy}
              on:click={() => unassign(event)}
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        {/each}
      {/if}
    </div>

    {#if addable.length > 0}
      <p class="m-0 text-[13px] font-extrabold text-ink-secondary">Add events</p>
      <StaffEventPicker
        events={addable}
        bind:selected
        variant="panel"
        idPrefix="staff-edit-event"
      />
      <div>
        <button
          type="button"
          class={chip}
          disabled={busy || selected.length === 0}
          on:click={addEvents}
        >
          {addLabel}
        </button>
      </div>
    {/if}

    <StaffTextField
      id="staff-edit-password"
      label="Set new password"
      type="password"
      variant="panel"
      autocomplete="new-password"
      bind:value={password}
      error={passwordError}
      on:input={onPasswordInput}
    />
    <div class="flex w-full items-center gap-3">
      <button type="button" class={chip} disabled={busy} on:click={savePassword}>
        Save password
      </button>
      {#if passwordSaved}
        <p class="m-0 text-xs leading-[1.5] text-green-700" role="status">Password updated.</p>
      {/if}
    </div>

    {#if notice}
      <StaffNotice tone="error">{notice}</StaffNotice>
    {/if}

    <div class="flex w-full items-center justify-between pt-1.5">
      <button
        type="button"
        class="cursor-pointer border-0 bg-transparent p-0 text-xs leading-[1.5] text-red-500 underline hover:text-red-700"
        on:click={() => dispatch("revoke", staff)}
      >
        Revoke access
      </button>
      <button
        type="button"
        class="flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-brand px-8 text-base font-extrabold text-white shadow-[0px_10px_24px_-8px_rgba(255,90,31,0.2)] hover:bg-brand/90"
        on:click={() => dispatch("close")}
      >
        Done
      </button>
    </div>
  {/if}
</AppDialog>
