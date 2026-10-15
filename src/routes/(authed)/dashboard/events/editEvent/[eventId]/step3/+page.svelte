<script>
  // @ts-nocheck
  import TicketDesignStep from "$lib/components/organizer/event-wizard/TicketDesignStep.svelte";
  import { editDraftKey } from "$lib/client/eventDraft";

  export let data;
</script>

<TicketDesignStep
  mode="edit"
  basePath="/dashboard/events/editEvent/{data.event.id}"
  draftKey={editDraftKey(data.event.id)}
/>
