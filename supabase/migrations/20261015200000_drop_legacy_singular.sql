-- Drop legacy singular storage policies and tables.
-- Their rows were copied into events / guests / images by
-- 20260915010000_operator_identity_and_legacy_merge.sql (see legacy_id_map),
-- and the event_image bucket files were moved to event_images.
-- legacy_id_map is kept as the audit trail of that merge.

-- Policies for the deleted event_image bucket only.
-- "Event images are publicly accessible" (event_images) must stay.
DROP POLICY IF EXISTS "all policies access 7a6u0m_0" ON storage.objects;
DROP POLICY IF EXISTS "all policies access 7a6u0m_1" ON storage.objects;
DROP POLICY IF EXISTS "all policies access 7a6u0m_2" ON storage.objects;
DROP POLICY IF EXISTS "all policies access 7a6u0m_3" ON storage.objects;

-- No CASCADE: nothing depends on these tables, so fail loudly if that changes.
DROP TABLE IF EXISTS public.event, public.guest, public.image, public.seat;
