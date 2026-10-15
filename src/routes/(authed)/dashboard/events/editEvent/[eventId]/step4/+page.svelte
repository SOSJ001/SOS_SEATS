<script>
  // @ts-nocheck
  import ReviewStep from "$lib/components/organizer/event-wizard/ReviewStep.svelte";
  import { editDraftKey } from "$lib/client/eventDraft";

  export let data;
</script>

<ReviewStep
  mode="edit"
  basePath="/dashboard/events/editEvent/{data.event.id}"
  draftKey={editDraftKey(data.event.id)}
  event={data.event}
/>
