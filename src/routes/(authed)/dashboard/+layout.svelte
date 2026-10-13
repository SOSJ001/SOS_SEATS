<script>
  // @ts-nocheck
  /**
   * Path-based HI-FI shells (roadmap 1.4).
   * my-tickets → Attendee; scanner/<eventId>|staff → Door; else → Organiser
   * (Door events list /dashboard/scanner stays in the Organiser shell, roadmap 7.2).
   */
  import { page } from "$app/stores";
  import "$lib/styles/public-tokens.css";
  import OrganiserShell from "$lib/components/authed/OrganiserShell.svelte";
  import AttendeeShell from "$lib/components/authed/AttendeeShell.svelte";
  import DoorShell from "$lib/components/authed/DoorShell.svelte";
  import { staffContactLabel } from "$lib/components/staff/staffFormat.js";

  export let data;

  $: userName = data.userName || "User";
  $: linkedWalletAddress = data.linkedWalletAddress || null;
  $: path = $page.url.pathname;
  $: isScannerEvent = /^\/dashboard\/scanner\/[^/]+/.test(path);
  $: isStaff = path.startsWith("/dashboard/staff");
  $: shell =
    path.includes("/eventDetails/pay-now") ||
    path.includes("/eventDetails/confirm-issue") ||
    path.includes("/eventDetails/issue-success")
      ? "none"
      : path.startsWith("/dashboard/my-tickets")
        ? "attendee"
        : isScannerEvent || isStaff
          ? "door"
          : "organiser";

  // Scanner header comes from the page's own load data so it renders on the server.
  $: scannerEvent = isScannerEvent ? $page.data?.event : null;
  $: doorRole = isStaff || $page.data?.role === "staff" ? "staff" : "organiser";
  // Staff session names are the raw contact; show phones masked like everywhere else.
  $: staffContact = $page.data?.staffContact || null;
  $: doorUserName = staffContact ? staffContactLabel(staffContact) : userName;
</script>

{#if shell === "none"}
  <slot />
{:else if shell === "attendee"}
  <AttendeeShell {userName}>
    <slot />
  </AttendeeShell>
{:else if shell === "door"}
  <DoorShell
    userName={doorUserName}
    roleLabel={doorRole === "staff" ? "STAFF" : "ORGANISER"}
    homeHref={doorRole === "staff" ? "/dashboard/staff" : "/dashboard/scanner"}
    flush={!!scannerEvent || isStaff}
    title={scannerEvent?.name || ""}
    backHref={scannerEvent ? $page.data?.backHref || "/dashboard/scanner" : ""}
    backLabel={$page.data?.backLabel || "Back to Door events"}
    contactType={isStaff ? staffContact?.type || "" : ""}
  >
    <slot />
  </DoorShell>
{:else}
  <OrganiserShell {userName} {linkedWalletAddress}>
    <slot />
  </OrganiserShell>
{/if}
