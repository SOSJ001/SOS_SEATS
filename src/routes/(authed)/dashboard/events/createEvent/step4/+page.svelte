<script>
  // @ts-nocheck
  /** FR-8a Step 4: Review & publish (HI-FI 55:1378 / mobile 36:157). */
  import ReviewStep from "$lib/components/organizer/event-wizard/ReviewStep.svelte";
  import { EVENT_DRAFT_KEY } from "$lib/client/eventDraft";
</script>

<ReviewStep
  mode="create"
  basePath="/dashboard/events/createEvent"
  draftKey={EVENT_DRAFT_KEY}
/>
