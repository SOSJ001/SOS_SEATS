<script>
  // @ts-nocheck
  /** Door scanner for one owned event (roadmap 7.2). Header lives in DoorShell. */
  import DoorScanner from "$lib/components/door/DoorScanner.svelte";

  export let data;
</script>

<svelte:head>
  <title>Door Scanner - {data.event.name} | SOS SEATS</title>
</svelte:head>

<DoorScanner
  event={data.event}
  stats={data.stats}
  recent={data.recent}
  role={data.role}
  backHref={data.backHref}
  userName={data.userName}
  staffContact={data.staffContact}
/>
