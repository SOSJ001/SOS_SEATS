<script>
  // @ts-nocheck
  /** FR-8a Step 3: Ticket design (HI-FI 55:1282 / mobile 36:88). */
  import TicketDesignStep from "$lib/components/organizer/event-wizard/TicketDesignStep.svelte";
  import { EVENT_DRAFT_KEY } from "$lib/client/eventDraft";
</script>

<TicketDesignStep
  mode="create"
  basePath="/dashboard/events/createEvent"
  draftKey={EVENT_DRAFT_KEY}
/>
