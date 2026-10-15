<script>
  // @ts-nocheck
  import EventDetailsStep from "$lib/components/organizer/event-wizard/EventDetailsStep.svelte";
  import { editDraftKey } from "$lib/client/eventDraft";

  export let data;
</script>

<EventDetailsStep
  mode="edit"
  basePath="/dashboard/events/editEvent/{data.event.id}"
  draftKey={editDraftKey(data.event.id)}
  event={data.event}
/>
