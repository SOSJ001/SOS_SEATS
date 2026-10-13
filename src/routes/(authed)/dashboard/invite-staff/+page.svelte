<script>
  // @ts-nocheck
  /**
   * Invite Staff (roadmap 7.3 / FR-42). HI-FI 55:2052 desktop, 36:738 mobile.
   * The OrganiserShell draws the sidebar and topbar.
   */
  import { invalidateAll } from "$app/navigation";
  import StaffInviteForm from "$lib/components/staff/StaffInviteForm.svelte";
  import StaffList from "$lib/components/staff/StaffList.svelte";
  import StaffNotice from "$lib/components/staff/StaffNotice.svelte";
  import StaffEditDialog from "$lib/components/staff/StaffEditDialog.svelte";
  import StaffRevokeDialog from "$lib/components/staff/StaffRevokeDialog.svelte";

  export let data;

  $: staff = data.staff || [];
  $: eligibleEvents = data.eligibleEvents || [];

  /** @type {string | null} */
  let editingId = null;
  $: editing = staff.find((s) => s.id === editingId) || null;

  /** @type {string | null} */
  let revokingId = null;
  $: revoking = staff.find((s) => s.id === revokingId) || null;

  function onRevoked(e) {
    revokingId = null;
    if (highlightId === e.detail.id) highlightId = null;
    invalidateAll();
  }

  /** @type {string | null} */
  let highlightId = null;
  /** Mobile 1540:4891 shows only the success view; desktop keeps the list. */
  let showingSuccess = false;

  const card =
    "w-full lg:rounded-2xl lg:border lg:border-paper-border lg:bg-white lg:p-4 lg:shadow-[0px_4px_6px_rgba(0,0,0,0.04)]";
</script>

<svelte:head>
  <title>Invite Staff | SOS SEATS</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-[1200px] flex-col gap-5">
  {#if data.loadError}
    <StaffNotice tone="error">
      Couldn't load your staff and events. Refresh the page to try again.
    </StaffNotice>
  {/if}

  <div class="grid w-full grid-cols-1 items-start gap-6 pb-6 lg:grid-cols-2 lg:gap-5">
    <div class={card}>
      <StaffInviteForm
        {eligibleEvents}
        bind:showingSuccess
        on:invited={() => invalidateAll()}
        on:highlight={(e) => (highlightId = e.detail)}
      />
    </div>
    <div class="{card} pt-2 lg:block lg:pt-4 {showingSuccess ? 'hidden' : ''}">
      <StaffList
        {staff}
        {highlightId}
        on:edit={(e) => (editingId = e.detail.id)}
        on:revoke={(e) => (revokingId = e.detail.id)}
      />
    </div>
  </div>
</div>

<StaffEditDialog
  staff={editing}
  {eligibleEvents}
  on:close={() => (editingId = null)}
  on:changed={() => invalidateAll()}
  on:revoke={(e) => {
    editingId = null;
    revokingId = e.detail.id;
  }}
/>

<StaffRevokeDialog staff={revoking} on:close={() => (revokingId = null)} on:revoked={onRevoked} />
