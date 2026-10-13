<script>
  // @ts-nocheck
  /**
   * Create Staff Account (HI-FI 55:2107 desktop card, 36:757 mobile).
   * States: validation 1540:4037, contact in use 1540:4280, already staff 1540:4526,
   * success 1540:4684, no events 1540:5172. Posts to /api/staff/invite.
   */
  import { createEventDispatcher, onMount } from "svelte";
  import User from "lucide-svelte/icons/user";
  import StaffTextField from "./StaffTextField.svelte";
  import StaffEventPicker from "./StaffEventPicker.svelte";
  import StaffNotice from "./StaffNotice.svelte";
  import StaffInviteSuccess from "./StaffInviteSuccess.svelte";
  import { checkStaffContact } from "./staffFormat.js";

  /** @type {{ id: string, name: string, date: string | null }[]} */
  export let eligibleEvents = [];
  /** Bindable: true while the Staff Account Created view replaces the form. */
  export let showingSuccess = false;

  const PASSWORD_MIN = 8;
  const COPY = {
    contact: "Enter a valid email or a Sierra Leone number (+232).",
    password: `Password must be at least ${PASSWORD_MIN} characters.`,
    events: "Select at least one event.",
  };

  const dispatch = createEventDispatcher();

  let contact = "";
  let password = "";
  /** @type {string[]} */
  let selected = [];
  let errors = { contact: "", password: "", events: "" };
  /** @type {{ tone: "error" | "success", text: string } | null} */
  let notice = null;
  let saving = false;
  /** @type {{ contact: string, events: { name: string }[] } | null} */
  let created = null;
  /** Desktop placeholders from lg up; mobile copy on the server render. */
  let wide = false;

  $: showingSuccess = !!created;
  $: noEvents = eligibleEvents.length === 0;
  $: eligibleIds = new Set(eligibleEvents.map((e) => e.id));
  $: selected = selected.filter((id) => eligibleIds.has(id));

  onMount(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => (wide = query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  });

  function alreadyStaffText(added) {
    if (!added) return "Already your staff. No new events added. Password unchanged.";
    return `Already your staff. ${added} event${added === 1 ? "" : "s"} added. Password unchanged.`;
  }

  /** @param {"contact" | "password" | "events"} field */
  function clearError(field) {
    if (errors[field]) errors = { ...errors, [field]: "" };
  }

  function onContactInput() {
    clearError("contact");
    if (notice?.tone === "error") notice = null;
  }

  function reset() {
    contact = "";
    password = "";
    selected = [];
    errors = { contact: "", password: "", events: "" };
    notice = null;
    created = null;
  }

  async function submit() {
    notice = null;
    dispatch("highlight", null);
    errors = {
      contact: checkStaffContact(contact) ? "" : COPY.contact,
      password: password.length >= PASSWORD_MIN ? "" : COPY.password,
      events: selected.length > 0 ? "" : COPY.events,
    };
    if (errors.contact || errors.password || errors.events) return;

    saving = true;
    try {
      const res = await fetch("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, password, eventIds: selected }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok || !body.success) {
        if (body.field === "contact" || body.field === "password") {
          errors = { ...errors, [body.field]: COPY[body.field] };
        } else if (body.field === "events") {
          errors = { ...errors, events: body.error ? `${body.error}.` : COPY.events };
        } else {
          notice = { tone: "error", text: body.error || "Something went wrong. Try again." };
        }
        return;
      }

      dispatch("invited");
      if (body.alreadyStaff) {
        notice = { tone: "success", text: alreadyStaffText(body.added) };
        dispatch("highlight", body.staffId || null);
        contact = "";
        password = "";
        return;
      }
      created = { contact: body.contact, events: body.events || [] };
    } catch {
      notice = {
        tone: "error",
        text: "Couldn't reach SOS SEATS. Check your connection and try again.",
      };
    } finally {
      saving = false;
    }
  }
</script>

{#if created}
  <StaffInviteSuccess
    contact={created.contact}
    events={created.events}
    on:again={reset}
    on:done={reset}
  />
{:else}
  <form class="flex w-full flex-col gap-4" novalidate on:submit|preventDefault={submit}>
    <div class="hidden w-full items-center gap-3 lg:flex">
      <div
        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"
        aria-hidden="true"
      >
        <User size={20} strokeWidth={2} />
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <h2 class="m-0 text-lg font-extrabold text-ink">Create Staff Account</h2>
        <p class="m-0 text-[13px] leading-normal text-ink-body">
          Set a login for door staff or scanners. They can only scan the events you assign.
        </p>
      </div>
    </div>

    {#if notice}
      <StaffNotice tone={notice.tone}>{notice.text}</StaffNotice>
    {/if}

    <StaffTextField
      id="staff-contact"
      label="Staff Email or Phone Number"
      bind:value={contact}
      autocomplete="off"
      placeholder={wide
        ? "e.g. staff.member@gmail.com or +232 76..."
        : "e.g. +232 76 543210 or staff@email.sl"}
      error={errors.contact}
      on:input={onContactInput}
    />

    <StaffTextField
      id="staff-password"
      label="Password"
      mobileLabel="Set Password"
      type="password"
      autocomplete="new-password"
      bind:value={password}
      placeholder={wide ? "•••••••• (Min 8 characters)" : "Min 8 characters"}
      error={errors.password}
      on:input={() => clearError("password")}
    />

    <div
      class="flex w-full min-w-0 flex-col gap-2 lg:gap-3 lg:py-2"
      role="group"
      aria-labelledby="staff-events-label"
    >
      <p id="staff-events-label" class="m-0 text-xs font-bold uppercase text-ink-secondary lg:hidden">
        Assign to Events
      </p>
      <div class="hidden flex-col gap-1 lg:flex">
        <p class="m-0 text-[13px] font-extrabold text-ink-secondary">Assign Events Access</p>
        <p class="m-0 text-xs leading-normal text-ink-body">
          Choose which events this staff member can scan tickets for. You can update access
          later.
        </p>
      </div>
      <StaffEventPicker events={eligibleEvents} bind:selected
        error={errors.events}
        on:change={() => clearError("events")}
      />
    </div>

    <button
      type="submit"
      disabled={saving || noEvents}
      class="h-12 w-full cursor-pointer rounded-lg border-0 bg-brand text-[15px] font-bold text-white hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-[0.45] lg:h-10 lg:rounded-xl lg:text-[13px] lg:font-extrabold lg:shadow-[0px_10px_24px_-8px_rgba(255,90,31,0.2)]"
    >
      {saving ? "Saving..." : "Save Staff"}
    </button>

    <StaffNotice tone="info">
      <span class="lg:hidden">
        SOS SEATS does not send email or SMS. Share the login and password with your staff
        directly.
      </span>
      <span class="hidden lg:inline">
        SOS SEATS does not send email or SMS. Share the login and password with your door team
        yourself.
      </span>
    </StaffNotice>
  </form>
{/if}
