<script>
  // @ts-nocheck
  /** FR-8a Step 1: Event Information (desktop 55:1131 / mobile 4:724). */
  import { page } from "$app/stores";
  import EventDetailsStep from "$lib/components/organizer/event-wizard/EventDetailsStep.svelte";
  import { EVENT_DRAFT_KEY } from "$lib/client/eventDraft";

  export let data;
</script>

<EventDetailsStep
  mode="create"
  basePath="/dashboard/events/createEvent"
  draftKey={EVENT_DRAFT_KEY}
  userName={$page.data?.userName || data?.userName || ""}
/>
