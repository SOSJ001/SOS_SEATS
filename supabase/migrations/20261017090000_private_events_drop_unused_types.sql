-- Private events are invite only and no longer carry sellable ticket types.
-- Deactivate the unused (never sold, no guests, no order items) sellable types
-- left on existing private events, then recompute their total_capacity with the
-- same rule as ticketCapacity(): skip "Private Invite", count sold_quantity for
-- inactive types and quantity for active ones. Sold types are left as they are.

UPDATE public.ticket_types tt
SET is_active = false
FROM public.events e
WHERE tt.event_id = e.id
  AND lower(e.event_visibility) = 'private'
  AND lower(trim(tt.name)) <> 'private invite'
  AND COALESCE(tt.is_active, true)
  AND COALESCE(tt.sold_quantity, 0) = 0
  AND NOT EXISTS (SELECT 1 FROM public.guests g WHERE g.ticket_type_id = tt.id)
  AND NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.ticket_type_id = tt.id);

UPDATE public.events e
SET total_capacity = COALESCE((
  SELECT SUM(
    CASE
      WHEN tt.is_active = false THEN COALESCE(tt.sold_quantity, 0)
      ELSE COALESCE(tt.quantity, 0)
    END
  )
  FROM public.ticket_types tt
  WHERE tt.event_id = e.id
    AND lower(trim(tt.name)) <> 'private invite'
), 0)
WHERE lower(e.event_visibility) = 'private';
