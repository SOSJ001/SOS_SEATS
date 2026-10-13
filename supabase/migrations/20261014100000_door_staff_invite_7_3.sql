-- 7.3 door-staff invite (FR-42). One transaction for a new staff login.
-- create_door_staff: called by Kit after it creates the synthetic Auth user.
--   A contact is active staff for one organizer at a time (3.4 unique indexes).
--   Same organizer: raises already_staff (Kit adds assignments instead).
--   Other organizer with an assigned event today or later: raises contact_in_use.
--   Otherwise the old row is revoked and its auth_user_id is returned so Kit
--   can ban that login. The 3.4 trigger checks every event belongs to the organizer.
-- Kit service-role only.

-- ---------------------------------------------------------------------------
-- 1. create_door_staff
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_door_staff(
  p_staff_id uuid,
  p_organizer uuid,
  p_auth_user uuid,
  p_login_type text,
  p_login_email text,
  p_login_phone text,
  p_event_ids uuid[],
  p_today date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing door_staff%ROWTYPE;
  v_replaced uuid;
BEGIN
  IF p_event_ids IS NULL OR cardinality(p_event_ids) = 0 THEN
    RAISE EXCEPTION 'no_events' USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_existing
  FROM door_staff
  WHERE revoked_at IS NULL
    AND (
      (p_login_type = 'email' AND login_email = p_login_email)
      OR (p_login_type = 'phone' AND login_phone = p_login_phone)
    )
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.organizer_user_id = p_organizer THEN
      RAISE EXCEPTION 'already_staff';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM door_staff_events se
      JOIN events e ON e.id = se.event_id
      WHERE se.staff_id = v_existing.id
        AND e.date >= p_today
    ) THEN
      RAISE EXCEPTION 'contact_in_use';
    END IF;

    UPDATE door_staff SET revoked_at = now() WHERE id = v_existing.id;
    v_replaced := v_existing.auth_user_id;
  END IF;

  INSERT INTO door_staff (id, organizer_user_id, auth_user_id, login_type, login_email, login_phone)
  VALUES (p_staff_id, p_organizer, p_auth_user, p_login_type, p_login_email, p_login_phone);

  INSERT INTO door_staff_events (staff_id, event_id)
  SELECT p_staff_id, ev
  FROM (SELECT DISTINCT unnest(p_event_ids) AS ev) ids;

  RETURN v_replaced;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_door_staff(uuid, uuid, uuid, text, text, text, uuid[], date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_door_staff(uuid, uuid, uuid, text, text, text, uuid[], date) TO service_role;
