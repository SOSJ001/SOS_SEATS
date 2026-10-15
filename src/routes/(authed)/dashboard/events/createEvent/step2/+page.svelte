<script>
  // @ts-nocheck
  /** FR-8a Step 2: Ticket types (HI-FI 506:238 desktop / 506:107 mobile free). */
  import TicketTypesStep from "$lib/components/organizer/event-wizard/TicketTypesStep.svelte";
  import { EVENT_DRAFT_KEY } from "$lib/client/eventDraft";
</script>

<TicketTypesStep
  mode="create"
  basePath="/dashboard/events/createEvent"
  draftKey={EVENT_DRAFT_KEY}
/>
