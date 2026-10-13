-- 3.4 door-staff schema (Data Model 2.12 door_staff, 2.13 door_staff_events).
-- door_staff: one row per staff login, owned by the organizer who created it.
--   Passwords live in Supabase Auth only (synthetic staff Auth email per row).
--   A contact (email or phone) is active staff for one organizer at a time.
--   Revoke sets revoked_at; rows are not deleted.
-- door_staff_events: event assignments. Unassign deletes the row.
-- Both tables are Kit service-role only. Sign-in, invite and scan logic are 7.3.

-- ---------------------------------------------------------------------------
-- 1. door_staff
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.door_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_user_id uuid NOT NULL,
  auth_user_id uuid NOT NULL UNIQUE,
  login_type text NOT NULL CHECK (login_type IN ('email', 'phone')),
  login_email text,
  login_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT door_staff_contact_matches_type CHECK (
    (login_type = 'email' AND login_email IS NOT NULL AND login_phone IS NULL AND login_email = lower(login_email))
    OR (login_type = 'phone' AND login_phone IS NOT NULL AND login_email IS NULL AND login_phone ~ '^\+232[0-9]{8}$')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS door_staff_active_email_key
  ON public.door_staff (login_email)
  WHERE revoked_at IS NULL AND login_email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS door_staff_active_phone_key
  ON public.door_staff (login_phone)
  WHERE revoked_at IS NULL AND login_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS door_staff_organizer_idx
  ON public.door_staff (organizer_user_id);

ALTER TABLE public.door_staff ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.door_staff FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.door_staff TO service_role;

-- ---------------------------------------------------------------------------
-- 2. door_staff_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.door_staff_events (
  staff_id uuid NOT NULL REFERENCES public.door_staff(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (staff_id, event_id)
);

CREATE INDEX IF NOT EXISTS door_staff_events_event_idx
  ON public.door_staff_events (event_id);

ALTER TABLE public.door_staff_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.door_staff_events FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.door_staff_events TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Assignment guard: event owned by the staff row's organizer, staff not revoked
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.door_staff_events_check_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM door_staff s
    JOIN events e ON e.id = NEW.event_id
    WHERE s.id = NEW.staff_id
      AND s.revoked_at IS NULL
      AND e.user_id = s.organizer_user_id
  ) THEN
    RAISE EXCEPTION 'door staff assignment rejected'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS door_staff_events_check_owner ON public.door_staff_events;
CREATE TRIGGER door_staff_events_check_owner
  BEFORE INSERT OR UPDATE ON public.door_staff_events
  FOR EACH ROW EXECUTE FUNCTION public.door_staff_events_check_owner();

REVOKE EXECUTE ON FUNCTION public.door_staff_events_check_owner() FROM PUBLIC, anon, authenticated;
