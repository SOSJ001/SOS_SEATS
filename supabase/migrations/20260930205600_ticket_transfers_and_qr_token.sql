-- 6.2b ticket transfer.
-- guests.qr_token: secret QR payload, rotated on every transfer. ticket_number stays display only.
-- order_items.owner_user_id: current holder (Auth id). My Tickets and transfers key on it;
--   orders.buyer_id stays the purchaser and current_owner stays frozen legacy.
-- ticket_transfers: append-only log with a public reference, never stores tokens.
-- transfer_order_item: one-transaction transfer, called by the Kit API with the service role only.

-- ---------------------------------------------------------------------------
-- 1. Owner resolution (web3 id -> linked Auth id; unlinked web3 id -> null)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_ticket_owner(p_buyer uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN p_buyer IS NULL THEN NULL
    WHEN EXISTS (SELECT 1 FROM web3_users w WHERE w.id = p_buyer)
      THEN (SELECT w.linked_auth_user_id FROM web3_users w WHERE w.id = p_buyer)
    ELSE p_buyer
  END;
$$;

-- ---------------------------------------------------------------------------
-- 2. guests.qr_token (volatile default gives every existing row its own token)
-- ---------------------------------------------------------------------------
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS qr_token text NOT NULL
  DEFAULT replace(gen_random_uuid()::text, '-', '');

ALTER TABLE public.guests
  DROP CONSTRAINT IF EXISTS guests_qr_token_format;
ALTER TABLE public.guests
  ADD CONSTRAINT guests_qr_token_format CHECK (qr_token ~ '^[0-9a-f]{32}$');

CREATE UNIQUE INDEX IF NOT EXISTS guests_qr_token_key ON public.guests (qr_token);

-- ---------------------------------------------------------------------------
-- 3. order_items.owner_user_id + backfill
-- ---------------------------------------------------------------------------
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS owner_user_id uuid;

CREATE INDEX IF NOT EXISTS order_items_owner_user_id_idx
  ON public.order_items (owner_user_id);

UPDATE public.order_items oi
   SET owner_user_id = public.resolve_ticket_owner(o.buyer_id)
  FROM public.orders o
 WHERE o.id = oi.order_id
   AND oi.owner_user_id IS NULL
   AND o.buyer_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Keep new tickets owned (never overwrites a transferred ticket)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.order_items_set_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.owner_user_id IS NULL THEN
    SELECT public.resolve_ticket_owner(o.buyer_id)
      INTO NEW.owner_user_id
      FROM orders o
     WHERE o.id = NEW.order_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_items_set_owner ON public.order_items;
CREATE TRIGGER order_items_set_owner
  BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.order_items_set_owner();

CREATE OR REPLACE FUNCTION public.orders_sync_item_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.buyer_id IS NOT NULL THEN
    UPDATE order_items
       SET owner_user_id = public.resolve_ticket_owner(NEW.buyer_id)
     WHERE order_id = NEW.id
       AND owner_user_id IS NULL;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS orders_sync_item_owner ON public.orders;
CREATE TRIGGER orders_sync_item_owner
  AFTER UPDATE OF buyer_id ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_sync_item_owner();

-- ---------------------------------------------------------------------------
-- 5. ticket_transfers (append-only, no tokens)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  to_username text NOT NULL,
  reference text GENERATED ALWAYS AS (
    'TRF-' || upper(left(replace(id::text, '-', ''), 8))
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ticket_transfers_reference_key
  ON public.ticket_transfers (reference);
CREATE INDEX IF NOT EXISTS ticket_transfers_from_user_created_idx
  ON public.ticket_transfers (from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ticket_transfers_order_item_idx
  ON public.ticket_transfers (order_item_id);

ALTER TABLE public.ticket_transfers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ticket_transfers FROM anon, authenticated;
GRANT SELECT, INSERT ON public.ticket_transfers TO service_role;

-- ---------------------------------------------------------------------------
-- 6. transfer_order_item (legacy transfer_ticket(UUID,TEXT,TEXT,TEXT) left untouched)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transfer_order_item(
  p_order_item_id uuid,
  p_from_user_id uuid,
  p_to_username text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item record;
  v_guest record;
  v_event record;
  v_to record;
  v_username text := lower(regexp_replace(trim(coalesce(p_to_username, '')), '^@', ''));
  v_pay_status text;
  v_is_free boolean;
  v_transfer_id uuid;
  v_reference text;
BEGIN
  IF p_order_item_id IS NULL OR p_from_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'not_owner');
  END IF;

  SELECT oi.id, oi.owner_user_id, oi.quantity, oi.check_in_time, oi.guest_id,
         o.event_id, o.payment_status, o.payment_method, o.total_amount
    INTO v_item
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
   WHERE oi.id = p_order_item_id
   FOR UPDATE OF oi;

  IF NOT FOUND OR v_item.owner_user_id IS DISTINCT FROM p_from_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'not_owner');
  END IF;

  -- Same fulfilled rule as loadMyTicketsForBuyer
  v_pay_status := lower(coalesce(v_item.payment_status, ''));
  v_is_free := lower(coalesce(v_item.payment_method, '')) = 'free'
    OR coalesce(v_item.total_amount, 0) = 0;
  IF NOT (
    v_pay_status IN ('completed', 'paid', 'confirmed')
    OR (v_is_free AND v_pay_status = '')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'order_not_fulfilled');
  END IF;

  IF v_item.quantity IS DISTINCT FROM 1 THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'not_single');
  END IF;

  IF v_item.guest_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'no_guest');
  END IF;

  SELECT g.id, g.status, g.check_in_time
    INTO v_guest
    FROM guests g
   WHERE g.id = v_item.guest_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'no_guest');
  END IF;

  IF v_item.check_in_time IS NOT NULL
     OR v_guest.check_in_time IS NOT NULL
     OR lower(coalesce(v_guest.status, '')) IN ('checked-in', 'checked_in') THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'checked_in');
  END IF;

  SELECT e.date, e.time INTO v_event FROM events e WHERE e.id = v_item.event_id;
  IF NOT FOUND
     OR v_event.date IS NULL
     OR ((v_event.date + coalesce(v_event.time, '00:00'::time)) AT TIME ZONE 'Africa/Freetown') <= now() THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'event_started');
  END IF;

  SELECT w.id, w.username, w.is_active, w.linked_auth_user_id
    INTO v_to
    FROM web3_users w
   WHERE w.username = v_username;

  IF v_username = '' OR NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'recipient_not_found');
  END IF;
  IF v_to.is_active IS FALSE THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'recipient_inactive');
  END IF;
  IF v_to.linked_auth_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'recipient_unlinked');
  END IF;
  IF v_to.linked_auth_user_id = p_from_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'self_transfer');
  END IF;

  UPDATE order_items
     SET owner_user_id = v_to.linked_auth_user_id
   WHERE id = v_item.id;

  UPDATE guests
     SET qr_token = replace(gen_random_uuid()::text, '-', ''),
         first_name = v_to.username,
         last_name = 'Guest',
         email = NULL,
         phone = NULL,
         updated_at = now()
   WHERE id = v_guest.id;

  -- reference is 8 hex chars of the id; retry on the rare collision
  FOR attempt IN 1..3 LOOP
    BEGIN
      INSERT INTO ticket_transfers (order_item_id, event_id, from_user_id, to_user_id, to_username)
      VALUES (v_item.id, v_item.event_id, p_from_user_id, v_to.linked_auth_user_id, v_to.username)
      RETURNING id, reference INTO v_transfer_id, v_reference;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF attempt = 3 THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'transfer_id', v_transfer_id,
    'reference', v_reference,
    'to_username', v_to.username
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Grants: service_role only
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.resolve_ticket_owner(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.order_items_set_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.orders_sync_item_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.transfer_order_item(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_order_item(uuid, uuid, text) TO service_role;
