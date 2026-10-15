-- Payment attempts, marketplace ticket holds and safe ticket creation.

-- 1. One order per payment.
-- Two webhooks for one Monime payment created two orders for code
-- pmc-k6VAB6yuZpgLPWAnT7gPZRQt5Wn. Remove the second one (never checked in or
-- transferred); deleting the order also removes its order item.
DELETE FROM public.orders
WHERE id = '715c4482-1855-483c-b917-d5ff25f31a30'
  AND transaction_hash = 'pmc-k6VAB6yuZpgLPWAnT7gPZRQt5Wn';

DELETE FROM public.guests
WHERE id = '22f0e881-3025-4b08-942f-324af7e074c0'
  AND NOT EXISTS (
    SELECT 1 FROM public.order_items
    WHERE guest_id = '22f0e881-3025-4b08-942f-324af7e074c0'
  );

CREATE UNIQUE INDEX IF NOT EXISTS orders_transaction_hash_key
  ON public.orders (transaction_hash)
  WHERE transaction_hash IS NOT NULL AND transaction_hash <> '';

-- 2. Ledger rows written by private ticket issue.
ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_source_check;
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_source_check
  CHECK (source = ANY (ARRAY['mobile_money', 'solana', 'private_issue']));

ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type = ANY (ARRAY[
    'deposit', 'withdrawal', 'sale', 'refund', 'transfer', 'private_issue_payment'
  ]));

-- 3. Marketplace payment attempts. Each row holds the tickets while the buyer
-- pays and is the buyer's payment history. Server (service role) only.
CREATE TABLE IF NOT EXISTS public.checkout_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  selected_tickets jsonb NOT NULL,
  amount numeric(12,2) NOT NULL,
  payment_method text NOT NULL,
  payment_code_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'expired')),
  paid boolean NOT NULL DEFAULT false,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  error text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checkout_holds_event_pending_idx
  ON public.checkout_holds (event_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS checkout_holds_buyer_idx
  ON public.checkout_holds (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS checkout_holds_order_idx
  ON public.checkout_holds (order_id);

ALTER TABLE public.checkout_holds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_holds FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.checkout_holds TO service_role;

DROP TRIGGER IF EXISTS update_checkout_holds_updated_at ON public.checkout_holds;
CREATE TRIGGER update_checkout_holds_updated_at
  BEFORE UPDATE ON public.checkout_holds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Hold tickets before a payment code exists.
-- Active hold = pending and not past expires_at. A buyer keeps one pending hold
-- per event; a new one replaces the old and returns the old payment code so the
-- server can cancel it at Monime.
CREATE OR REPLACE FUNCTION public.create_checkout_hold(
  p_event_id uuid,
  p_buyer_id uuid,
  p_selected_tickets jsonb,
  p_amount numeric,
  p_payment_method text
)
RETURNS TABLE(
  success boolean,
  hold_id uuid,
  replaced_payment_code_ids text[],
  error_code text,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_request RECORD;
    v_type RECORD;
    v_held INTEGER;
    v_hold_id UUID;
    v_replaced TEXT[];
BEGIN
    IF p_selected_tickets IS NULL
       OR jsonb_typeof(p_selected_tickets) <> 'object'
       OR p_selected_tickets = '{}'::jsonb THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT[], 'invalid_selection'::TEXT,
            'This ticket selection is no longer valid. Please choose your ticket again.'::TEXT;
        RETURN;
    END IF;

    FOR v_request IN
        SELECT key::UUID AS id, (value #>> '{}')::INTEGER AS qty
        FROM jsonb_each(p_selected_tickets)
        ORDER BY 1
    LOOP
        IF v_request.qty IS NULL OR v_request.qty < 1 THEN
            RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT[], 'invalid_selection'::TEXT,
                'This ticket selection is no longer valid. Please choose your ticket again.'::TEXT;
            RETURN;
        END IF;

        SELECT quantity, COALESCE(sold_quantity, 0) AS sold, is_active, price
        INTO v_type
        FROM ticket_types
        WHERE id = v_request.id AND event_id = p_event_id
        FOR UPDATE;

        IF NOT FOUND OR v_type.price IS NULL OR v_type.price <= 0 THEN
            RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT[], 'invalid_selection'::TEXT,
                'This ticket selection is no longer valid. Please choose your ticket again.'::TEXT;
            RETURN;
        END IF;

        IF v_type.is_active = FALSE THEN
            RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT[], 'unavailable'::TEXT,
                'Sorry, this ticket is no longer available.'::TEXT;
            RETURN;
        END IF;

        -- The buyer's own holds are about to be replaced, so they don't count.
        SELECT COALESCE(SUM((h.selected_tickets ->> v_request.id::TEXT)::INTEGER), 0)
        INTO v_held
        FROM checkout_holds h
        WHERE h.event_id = p_event_id
          AND h.status = 'pending'
          AND h.expires_at > now()
          AND h.buyer_id <> p_buyer_id
          AND h.selected_tickets ? v_request.id::TEXT;

        IF v_type.quantity - v_type.sold - v_held < v_request.qty THEN
            RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT[], 'unavailable'::TEXT,
                'Sorry, this ticket is no longer available.'::TEXT;
            RETURN;
        END IF;
    END LOOP;

    UPDATE checkout_holds
    SET status = 'expired'
    WHERE event_id = p_event_id
      AND status = 'pending'
      AND paid = FALSE
      AND expires_at <= now();

    WITH replaced AS (
        UPDATE checkout_holds
        SET status = 'cancelled', error = 'Replaced by a new payment code'
        WHERE event_id = p_event_id
          AND buyer_id = p_buyer_id
          AND status = 'pending'
          AND paid = FALSE
        RETURNING payment_code_id
    )
    SELECT array_agg(payment_code_id) FILTER (WHERE payment_code_id IS NOT NULL)
    INTO v_replaced
    FROM replaced;

    INSERT INTO checkout_holds (
        event_id, buyer_id, selected_tickets, amount, payment_method, expires_at
    ) VALUES (
        p_event_id, p_buyer_id, p_selected_tickets, p_amount, p_payment_method,
        now() + interval '35 minutes'
    ) RETURNING id INTO v_hold_id;

    RETURN QUERY SELECT TRUE, v_hold_id, COALESCE(v_replaced, ARRAY[]::TEXT[]), NULL::TEXT, NULL::TEXT;
END;
$function$;

-- 5. Paid order: one order per payment code, respects other buyers' holds,
-- collision-free ticket numbers.
CREATE OR REPLACE FUNCTION public.create_paid_ticket_order_with_items(
  p_event_id uuid,
  p_buyer_wallet_address text,
  p_buyer_name text,
  p_order_number text,
  p_ticket_details jsonb,
  p_total_amount numeric,
  p_currency text,
  p_transaction_hash text,
  p_payment_method text
)
RETURNS TABLE(success boolean, order_id uuid, tickets_claimed integer, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_order_id UUID;
    v_existing_id UUID;
    v_hold_id UUID;
    v_hold_buyer UUID;
    v_held INTEGER;
    v_ticket_claimed_count INTEGER := 0;
    v_ticket_detail JSONB;
    v_ticket_type_id UUID;
    v_quantity INTEGER;
    v_price DECIMAL(10,2);
    v_available_quantity INTEGER;
    v_order_item_id UUID;
    v_guest_id UUID;
    v_ticket_number TEXT;
    v_guest_name TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
    v_request RECORD;
BEGIN
    IF p_transaction_hash IS NOT NULL AND p_transaction_hash <> '' THEN
        PERFORM pg_advisory_xact_lock(hashtext('paid_order:' || p_transaction_hash));

        SELECT o.id INTO v_existing_id
        FROM orders o
        WHERE o.transaction_hash = p_transaction_hash
        ORDER BY o.created_at
        LIMIT 1;

        IF v_existing_id IS NOT NULL THEN
            RETURN QUERY
            SELECT TRUE, v_existing_id,
                (SELECT COUNT(*)::INTEGER FROM order_items oi WHERE oi.order_id = v_existing_id),
                NULL::TEXT;
            RETURN;
        END IF;

        SELECT h.id, h.buyer_id INTO v_hold_id, v_hold_buyer
        FROM checkout_holds h
        WHERE h.payment_code_id = p_transaction_hash;
    END IF;

    FOR v_request IN
        SELECT (d->>'id')::UUID AS id, SUM((d->>'quantity')::INTEGER) AS qty
        FROM jsonb_array_elements(p_ticket_details) d
        GROUP BY 1
        ORDER BY 1
    LOOP
        SELECT quantity - COALESCE(sold_quantity, 0) INTO v_available_quantity
        FROM ticket_types
        WHERE id = v_request.id AND event_id = p_event_id
        FOR UPDATE;

        -- Other buyers' active holds; every hold of this buyer is skipped.
        SELECT COALESCE(SUM((h.selected_tickets ->> v_request.id::TEXT)::INTEGER), 0)
        INTO v_held
        FROM checkout_holds h
        WHERE h.event_id = p_event_id
          AND h.status = 'pending'
          AND h.expires_at > now()
          AND h.selected_tickets ? v_request.id::TEXT
          AND (v_hold_buyer IS NULL OR h.buyer_id <> v_hold_buyer);

        IF v_available_quantity IS NULL OR v_available_quantity - v_held < v_request.qty THEN
            RETURN QUERY SELECT FALSE, NULL::UUID, 0, 'Insufficient tickets available'::TEXT;
            RETURN;
        END IF;
    END LOOP;

    INSERT INTO orders (
        event_id,
        buyer_wallet_address,
        buyer_name,
        order_number,
        total_amount,
        currency,
        payment_method,
        payment_status,
        transaction_hash,
        order_status
    ) VALUES (
        p_event_id,
        p_buyer_wallet_address,
        p_buyer_name,
        p_order_number,
        p_total_amount,
        p_currency,
        p_payment_method,
        'completed',
        p_transaction_hash,
        'confirmed'
    ) RETURNING id INTO v_order_id;

    FOR v_ticket_detail IN SELECT * FROM jsonb_array_elements(p_ticket_details)
    LOOP
        v_ticket_type_id := (v_ticket_detail->>'id')::UUID;
        v_quantity := (v_ticket_detail->>'quantity')::INTEGER;
        v_price := (v_ticket_detail->>'price')::DECIMAL(10,2);

        FOR i IN 1..v_quantity LOOP
            INSERT INTO order_items (
                order_id,
                ticket_type_id,
                quantity,
                unit_price,
                total_price,
                current_owner
            ) VALUES (
                v_order_id,
                v_ticket_type_id,
                1,
                v_price,
                v_price,
                p_buyer_wallet_address
            ) RETURNING id INTO v_order_item_id;

            v_ticket_number := 'TKT-' || v_order_item_id::TEXT;

            v_guest_name := COALESCE(p_buyer_name, 'Guest User');
            v_first_name := SPLIT_PART(v_guest_name, ' ', 1);
            v_last_name := CASE
                WHEN POSITION(' ' IN v_guest_name) > 0 THEN SUBSTRING(v_guest_name FROM POSITION(' ' IN v_guest_name) + 1)
                ELSE ''
            END;

            INSERT INTO guests (
                event_id,
                ticket_type_id,
                first_name,
                last_name,
                wallet_address,
                ticket_number,
                status
            ) VALUES (
                p_event_id,
                v_ticket_type_id,
                v_first_name,
                v_last_name,
                p_buyer_wallet_address,
                v_ticket_number,
                'confirmed'
            ) RETURNING id INTO v_guest_id;

            UPDATE order_items
            SET guest_id = v_guest_id
            WHERE id = v_order_item_id;

            v_ticket_claimed_count := v_ticket_claimed_count + 1;
        END LOOP;

        -- sold_quantity is maintained by trigger_update_ticket_sold_quantity on order_items
    END LOOP;

    IF v_hold_id IS NOT NULL THEN
        UPDATE checkout_holds
        SET status = 'completed', paid = TRUE, order_id = v_order_id, error = NULL
        WHERE id = v_hold_id;

        UPDATE checkout_holds
        SET status = 'cancelled', error = 'Bought with another payment code'
        WHERE event_id = p_event_id
          AND buyer_id = v_hold_buyer
          AND status = 'pending'
          AND paid = FALSE
          AND id <> v_hold_id;
    END IF;

    RETURN QUERY SELECT TRUE, v_order_id, v_ticket_claimed_count, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0, SQLERRM::TEXT;
END;
$function$;

-- 6. Private ticket issue from a completed fee or payment row. Safe to call
-- any number of times: tickets are created once per row.
CREATE OR REPLACE FUNCTION public.issue_private_tickets(p_tx_id uuid)
RETURNS TABLE(success boolean, issued integer, already_issued boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_tx RECORD;
    v_event_id UUID;
    v_qty INTEGER;
    v_type_id UUID;
BEGIN
    SELECT id, source, status, metadata INTO v_tx
    FROM wallet_transactions
    WHERE id = p_tx_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, FALSE, 'Payment record not found'::TEXT;
        RETURN;
    END IF;

    IF v_tx.source <> 'private_issue' OR v_tx.status <> 'completed' THEN
        RETURN QUERY SELECT FALSE, 0, FALSE, 'Payment is not completed'::TEXT;
        RETURN;
    END IF;

    v_qty := NULLIF(v_tx.metadata->>'qty', '')::INTEGER;

    IF COALESCE((v_tx.metadata->>'tickets_issued')::BOOLEAN, FALSE) THEN
        RETURN QUERY SELECT TRUE, COALESCE(v_qty, 0), TRUE, NULL::TEXT;
        RETURN;
    END IF;

    v_event_id := NULLIF(v_tx.metadata->>'event_id', '')::UUID;
    IF v_event_id IS NULL OR v_qty IS NULL OR v_qty < 1 OR v_qty > 500 THEN
        RETURN QUERY SELECT FALSE, 0, FALSE, 'Payment record is missing the event or quantity'::TEXT;
        RETURN;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('private_invite:' || v_event_id::TEXT));

    SELECT id INTO v_type_id
    FROM ticket_types
    WHERE event_id = v_event_id AND name = 'Private Invite'
    LIMIT 1;

    IF v_type_id IS NULL THEN
        INSERT INTO ticket_types (
            event_id, name, description, price, quantity, sold_quantity, is_active
        ) VALUES (
            v_event_id, 'Private Invite', 'Privately generated organiser invite',
            0, 999999, 0, FALSE
        ) RETURNING id INTO v_type_id;
    END IF;

    INSERT INTO guests (
        event_id,
        ticket_type_id,
        first_name,
        last_name,
        email,
        phone,
        ticket_number,
        status,
        special_requirements
    )
    SELECT
        v_event_id,
        v_type_id,
        'Private',
        lpad(g::TEXT, 3, '0'),
        NULL,
        NULL,
        'TIX-' || replace(gen_random_uuid()::TEXT, '-', ''),
        'issued',
        'private_issue'
    FROM generate_series(1, v_qty) AS g;

    UPDATE ticket_types
    SET sold_quantity = COALESCE(sold_quantity, 0) + v_qty
    WHERE id = v_type_id;

    UPDATE wallet_transactions
    SET metadata = COALESCE(metadata, '{}'::jsonb)
        || jsonb_build_object('tickets_issued', TRUE, 'tickets_issued_at', now())
    WHERE id = p_tx_id;

    RETURN QUERY SELECT TRUE, v_qty, FALSE, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, FALSE, SQLERRM::TEXT;
END;
$function$;

-- 7. Server-only execute on every new or replaced function.
REVOKE EXECUTE ON FUNCTION public.create_checkout_hold(uuid, uuid, jsonb, numeric, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_checkout_hold(uuid, uuid, jsonb, numeric, text)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.create_paid_ticket_order_with_items(uuid, text, text, text, jsonb, numeric, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_paid_ticket_order_with_items(uuid, text, text, text, jsonb, numeric, text, text, text)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.issue_private_tickets(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_private_tickets(uuid)
  TO service_role;
