<script>
  // @ts-nocheck
  import TicketTypesStep from "$lib/components/organizer/event-wizard/TicketTypesStep.svelte";
  import { editDraftKey } from "$lib/client/eventDraft";

  export let data;
</script>

<TicketTypesStep
  mode="edit"
  basePath="/dashboard/events/editEvent/{data.event.id}"
  draftKey={editDraftKey(data.event.id)}
  event={data.event}
/>
