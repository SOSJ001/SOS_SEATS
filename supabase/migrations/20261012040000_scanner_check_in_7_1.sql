-- 7.1 door validate / check-in by guests.qr_token (FR-22 to FR-24).
-- scan_guest_ticket: p_commit = false validates without locks; p_commit = true checks in
--   atomically across guests and the linked order_items row (My Tickets reads order_items).
-- Lock order matches transfer_order_item (order_items, then guests) to avoid deadlocks.
-- Called by the Kit API with the service role only. Never returns the token.
-- Legacy check_in_guest / validate_and_check_in_ticket are left untouched until 7.2.

CREATE OR REPLACE FUNCTION public.scan_guest_ticket(
  p_event_id uuid,
  p_token text,
  p_commit boolean DEFAULT false,
  p_location text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token text := lower(trim(coalesce(p_token, '')));
  v_location text := nullif(left(trim(coalesce(p_location, '')), 120), '');
  v_guest_id uuid;
  v_guest_event uuid;
  v_item record;
  v_has_item boolean := false;
  v_guest record;
  v_status text;
  v_pay_status text;
  v_is_free boolean;
  v_used_at timestamptz;
  v_type_name text;
  v_ticket jsonb;
  v_now timestamptz := now();
BEGIN
  IF v_token !~ '^[0-9a-f]{32}$' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_token');
  END IF;

  SELECT g.id, g.event_id
    INTO v_guest_id, v_guest_event
    FROM guests g
   WHERE g.qr_token = v_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;

  IF p_event_id IS NULL OR v_guest_event IS DISTINCT FROM p_event_id THEN
    RETURN jsonb_build_object('ok', false, 'code', 'wrong_event');
  END IF;

  IF p_commit THEN
    SELECT oi.id, oi.check_in_time, o.payment_status, o.payment_method, o.total_amount
      INTO v_item
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
     WHERE oi.guest_id = v_guest_id
     LIMIT 1
     FOR UPDATE OF oi;
    v_has_item := FOUND;

    SELECT g.id, g.event_id, g.qr_token, g.status, g.check_in_time,
           g.first_name, g.last_name, g.ticket_number, g.ticket_type_id
      INTO v_guest
      FROM guests g
     WHERE g.id = v_guest_id
     FOR UPDATE;
  ELSE
    SELECT oi.id, oi.check_in_time, o.payment_status, o.payment_method, o.total_amount
      INTO v_item
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
     WHERE oi.guest_id = v_guest_id
     LIMIT 1;
    v_has_item := FOUND;

    SELECT g.id, g.event_id, g.qr_token, g.status, g.check_in_time,
           g.first_name, g.last_name, g.ticket_number, g.ticket_type_id
      INTO v_guest
      FROM guests g
     WHERE g.id = v_guest_id;
  END IF;

  -- A transfer may have rotated the token between lookup and lock
  IF NOT FOUND
     OR v_guest.qr_token IS DISTINCT FROM v_token
     OR v_guest.event_id IS DISTINCT FROM p_event_id THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;

  -- Same fulfilled rule as transfer_order_item
  IF v_has_item THEN
    v_pay_status := lower(coalesce(v_item.payment_status, ''));
    v_is_free := lower(coalesce(v_item.payment_method, '')) = 'free'
      OR coalesce(v_item.total_amount, 0) = 0;
    IF NOT (
      v_pay_status IN ('completed', 'paid', 'confirmed')
      OR (v_is_free AND v_pay_status = '')
    ) THEN
      RETURN jsonb_build_object('ok', false, 'code', 'not_admissible');
    END IF;
  END IF;

  v_status := lower(coalesce(v_guest.status, ''));
  v_used_at := LEAST(
    v_guest.check_in_time,
    CASE WHEN v_has_item THEN v_item.check_in_time END
  );

  IF v_used_at IS NOT NULL OR v_status IN ('checked-in', 'checked_in') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'already_checked_in',
      'checked_in_at', v_used_at
    );
  END IF;

  IF v_status NOT IN ('confirmed', 'issued') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_admissible');
  END IF;

  SELECT tt.name INTO v_type_name FROM ticket_types tt WHERE tt.id = v_guest.ticket_type_id;

  v_ticket := jsonb_build_object(
    'holder_name', trim(concat_ws(' ', v_guest.first_name, v_guest.last_name)),
    'ticket_type', coalesce(v_type_name, 'Ticket'),
    'ticket_number', v_guest.ticket_number
  );

  IF NOT p_commit THEN
    RETURN jsonb_build_object('ok', true, 'code', 'valid', 'ticket', v_ticket);
  END IF;

  UPDATE guests
     SET status = 'checked-in',
         check_in_time = v_now,
         check_in_location = coalesce(v_location, check_in_location),
         updated_at = v_now
   WHERE id = v_guest_id;

  IF v_has_item THEN
    UPDATE order_items
       SET check_in_time = v_now,
           check_in_location = coalesce(v_location, check_in_location)
     WHERE id = v_item.id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'code', 'checked_in',
    'ticket', v_ticket,
    'checked_in_at', v_now
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.scan_guest_ticket(uuid, text, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.scan_guest_ticket(uuid, text, boolean, text) TO service_role;
