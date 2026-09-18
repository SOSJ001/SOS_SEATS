<script>
  // @ts-nocheck
  /**
   * Path-based HI-FI shells (roadmap 1.4).
   * my-tickets → Attendee; scanner|staff → Door; else → Organiser.
   */
  import { page } from "$app/stores";
  import "$lib/styles/public-tokens.css";
  import OrganiserShell from "$lib/components/authed/OrganiserShell.svelte";
  import AttendeeShell from "$lib/components/authed/AttendeeShell.svelte";
  import DoorShell from "$lib/components/authed/DoorShell.svelte";

  export let data;

  $: userName = data.userName || "User";
  $: linkedWalletAddress = data.linkedWalletAddress || null;
  $: path = $page.url.pathname;
  $: shell =
    path.startsWith("/dashboard/my-tickets")
      ? "attendee"
      : path.startsWith("/dashboard/scanner") || path.startsWith("/dashboard/staff")
        ? "door"
        : "organiser";
</script>

{#if shell === "attendee"}
  <AttendeeShell {userName}>
    <slot />
  </AttendeeShell>
{:else if shell === "door"}
  <DoorShell {userName}>
    <slot />
  </DoorShell>
{:else}
  <OrganiserShell {userName} {linkedWalletAddress}>
    <slot />
  </OrganiserShell>
{/if}
