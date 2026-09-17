<script>
  // @ts-nocheck
  /**
   * Path-based HI-FI shells (roadmap 1.4).
   * my-tickets → Attendee; scanner → Door; else → Organiser.
   */
  import { page } from "$app/stores";
  import "$lib/styles/public-tokens.css";
  import OrganiserShell from "$lib/components/authed/OrganiserShell.svelte";
  import AttendeeShell from "$lib/components/authed/AttendeeShell.svelte";
  import DoorShell from "$lib/components/authed/DoorShell.svelte";

  export let data;

  $: userName = data.userName || "User";
  $: path = $page.url.pathname;
  $: shell =
    path.startsWith("/dashboard/my-tickets")
      ? "attendee"
      : path.startsWith("/dashboard/scanner")
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
  <OrganiserShell {userName}>
    <slot />
  </OrganiserShell>
{/if}
