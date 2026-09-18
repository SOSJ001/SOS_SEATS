-- 3.2 RLS harden (Option 1)
-- Drop open Allow-all policies; create public browse SELECTs;
-- enable RLS on legacy_id_map + multisig_removal_requests;
-- keep storage public SELECT on event_images; drop storage ALL.

-- =====================================================
-- 1) Drop open policies on plural tables
-- =====================================================

DROP POLICY IF EXISTS "Allow all events operations" ON public.events;
DROP POLICY IF EXISTS "Simple guests access" ON public.guests;
DROP POLICY IF EXISTS "Allow all operations on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all image operations" ON public.images;
DROP POLICY IF EXISTS "Allow all ticket_types operations" ON public.ticket_types;
DROP POLICY IF EXISTS "Users can view ticket types for public events" ON public.ticket_types;
DROP POLICY IF EXISTS "Allow all venue_sections operations" ON public.venue_sections;
DROP POLICY IF EXISTS "Allow all seating_options operations" ON public.seating_options;
DROP POLICY IF EXISTS "wallet_tx_select_all" ON public.wallet_transactions;
DROP POLICY IF EXISTS "wallet_tx_insert_all" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Allow all order item creation" ON public.order_items;
DROP POLICY IF EXISTS "Allow anonymous key order item updates" ON public.order_items;

-- Storage: drop Allow-all on event_images; keep public SELECT
DROP POLICY IF EXISTS "Allow all event image operations" ON storage.objects;

-- =====================================================
-- 2) Public browse SELECTs (required after dropping Allow-all)
-- =====================================================

CREATE POLICY "Public can view published public events"
  ON public.events
  FOR SELECT
  TO anon, authenticated
  USING (
    event_visibility = 'public'
    AND status IN ('published', 'live')
  );

CREATE POLICY "Public can view ticket types for public events"
  ON public.ticket_types
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = ticket_types.event_id
        AND e.event_visibility = 'public'
        AND e.status IN ('published', 'live')
    )
  );

CREATE POLICY "Public can view venue sections for public events"
  ON public.venue_sections
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = venue_sections.event_id
        AND e.event_visibility = 'public'
        AND e.status IN ('published', 'live')
    )
  );

CREATE POLICY "Public can view seating options for public events"
  ON public.seating_options
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = seating_options.event_id
        AND e.event_visibility = 'public'
        AND e.status IN ('published', 'live')
    )
  );

CREATE POLICY "Public can view public images"
  ON public.images
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Ensure storage public SELECT for event_images (CDN URLs)
DROP POLICY IF EXISTS "Event images are publicly accessible" ON storage.objects;
CREATE POLICY "Event images are publicly accessible"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'event_images');

-- =====================================================
-- 3) Enable RLS on previously unprotected tables
-- =====================================================

ALTER TABLE public.legacy_id_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multisig_removal_requests ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: only service_role (bypass) can access.
