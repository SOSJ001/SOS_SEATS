-- Shared category list, default per-type order limit of 1, and order RPCs that
-- check availability (with row locks) before inserting anything.

-- 1. Categories outside the shared list (null, "Entertainment", ...) become "Other".
UPDATE public.events
SET category = 'Other'
WHERE category IS NULL
   OR category NOT IN (
     'Music & Concerts', 'Nightlife & Parties', 'Comedy', 'Arts & Culture',
     'Film & Theatre', 'Festivals', 'Sports & Fitness', 'Tech',
     'Business & Networking', 'Workshops & Education', 'Food & Drink',
     'Fashion & Beauty', 'Faith & Church', 'Community & Charity',
     'Family & Kids', 'Other'
   );

-- 2. New seating_options rows default to 1 ticket per type, per order.
ALTER TABLE public.seating_options ALTER COLUMN max_seats_per_order SET DEFAULT 1;

-- 3. Free order RPC: lock and check every ticket type first, then insert.
--    No ROLLBACK (not allowed in a function); the EXCEPTION block undoes partial work.
CREATE OR REPLACE FUNCTION public.create_free_ticket_order_with_items(
  p_event_id uuid,
  p_buyer_wallet_address text,
  p_buyer_name text,
  p_order_number text,
  p_ticket_details jsonb
)
RETURNS TABLE(success boolean, order_id uuid, tickets_claimed integer, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_order_id UUID;
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
    BEGIN
        -- Lock rows in id order so concurrent claims cannot deadlock or oversell.
        FOR v_request IN
            SELECT (d->>'id')::UUID AS id, SUM((d->>'quantity')::INTEGER) AS qty
            FROM jsonb_array_elements(p_ticket_details) d
            GROUP BY 1
            ORDER BY 1
        LOOP
            SELECT quantity - sold_quantity INTO v_available_quantity
            FROM ticket_types
            WHERE id = v_request.id AND event_id = p_event_id
            FOR UPDATE;

            IF v_available_quantity IS NULL OR v_available_quantity < v_request.qty THEN
                RETURN QUERY SELECT FALSE, NULL::UUID, 0, 'Not enough tickets available for ticket type'::TEXT;
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
            order_status
        ) VALUES (
            p_event_id,
            p_buyer_wallet_address,
            p_buyer_name,
            p_order_number,
            0.00,
            'USD',
            'free',
            'completed',
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

                v_ticket_number := 'TIX-' || v_order_item_id::text;

                v_guest_name := COALESCE(p_buyer_name, 'Free Ticket User');
                v_first_name := split_part(v_guest_name, ' ', 1);
                v_last_name := CASE
                    WHEN position(' ' in v_guest_name) > 0 THEN
                        substring(v_guest_name from position(' ' in v_guest_name) + 1)
                    ELSE 'Guest'
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
            END LOOP;

            -- sold_quantity is maintained by trigger_update_ticket_sold_quantity on order_items

            v_ticket_claimed_count := v_ticket_claimed_count + v_quantity;
        END LOOP;

        RETURN QUERY SELECT TRUE, v_order_id, v_ticket_claimed_count, NULL::TEXT;

    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 0, SQLERRM::TEXT;
    END;
END;
$function$;

-- 4. Paid order RPC: same lock-and-check before the order row is created,
--    so a failed check no longer leaves an empty order behind.
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
    FOR v_request IN
        SELECT (d->>'id')::UUID AS id, SUM((d->>'quantity')::INTEGER) AS qty
        FROM jsonb_array_elements(p_ticket_details) d
        GROUP BY 1
        ORDER BY 1
    LOOP
        SELECT quantity - sold_quantity INTO v_available_quantity
        FROM ticket_types
        WHERE id = v_request.id AND event_id = p_event_id
        FOR UPDATE;

        IF v_available_quantity IS NULL OR v_available_quantity < v_request.qty THEN
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

            v_ticket_number := 'TKT-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || i;

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

    RETURN QUERY SELECT TRUE, v_order_id, v_ticket_claimed_count, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0, SQLERRM::TEXT;
END;
$function$;
