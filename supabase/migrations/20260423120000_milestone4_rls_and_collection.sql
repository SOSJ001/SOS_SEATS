-- Milestone 4: additive RLS for event organizers + public collection card RPC
-- See docs/RLS_ROLLOUT.md for rollback and verification gate.
-- Idempotent: safe to re-apply (matches remote apply via Supabase MCP).

DROP POLICY IF EXISTS "orders_select_event_organizer_v2" ON public.orders;
DROP POLICY IF EXISTS "order_items_select_event_organizer_v2" ON public.order_items;

-- ---------------------------------------------------------------------------
-- Inventory note (no drops of legacy policies in this migration)
-- Existing policies from 20250723000004_fix_existing_objects.sql include:
--   orders: "Users can manage own orders" / "Users can view own orders" (buyer_id = auth.uid())
--   order_items: tied to buyer's orders
--   guests: organizer paths via events.user_id = auth.uid()
-- wallet_transactions: not defined in repo migrations; manage in Studio if present.
-- ---------------------------------------------------------------------------

CREATE POLICY "orders_select_event_organizer_v2" ON public.orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = orders.event_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_select_event_organizer_v2" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.events e ON e.id = o.event_id
      WHERE o.id = order_items.order_id AND e.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.get_collection_ticket_display(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j jsonb;
BEGIN
  SELECT jsonb_build_object(
    'kind', 'guest',
    'eventName', e.name,
    'eventDate', e.date,
    'eventLocation', e.location,
    'ticketType', tt.name,
    'checkedIn', (g.check_in_time IS NOT NULL),
    'checkedInAt', g.check_in_time,
    'statusLabel', CASE WHEN g.check_in_time IS NOT NULL THEN 'digital_souvenir' ELSE 'unused' END
  )
  INTO j
  FROM public.guests g
  JOIN public.events e ON e.id = g.event_id
  LEFT JOIN public.ticket_types tt ON tt.id = g.ticket_type_id
  WHERE g.id = p_id;

  IF j IS NOT NULL THEN
    RETURN j;
  END IF;

  SELECT jsonb_build_object(
    'kind', 'order_item',
    'eventName', e.name,
    'eventDate', e.date,
    'eventLocation', e.location,
    'ticketType', tt.name,
    'checkedIn', (oi.check_in_time IS NOT NULL),
    'checkedInAt', oi.check_in_time,
    'statusLabel', CASE WHEN oi.check_in_time IS NOT NULL THEN 'digital_souvenir' ELSE 'unused' END
  )
  INTO j
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  JOIN public.events e ON e.id = o.event_id
  LEFT JOIN public.ticket_types tt ON tt.id = oi.ticket_type_id
  WHERE oi.id = p_id;

  RETURN j;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_collection_ticket_display(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.get_collection_ticket_display(uuid) IS 'Public-safe JSON for collector UI; no emails or wallet addresses.';
