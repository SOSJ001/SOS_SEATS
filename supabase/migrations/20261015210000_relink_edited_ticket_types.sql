-- Editing an event used to delete and recreate its ticket types, which set
-- guests.ticket_type_id / order_items.ticket_type_id to NULL (ON DELETE SET NULL)
-- and reset sold_quantity to 0. The app now updates ticket types in place.
--
-- 1. Relink orphaned rows on the three events the edit bug damaged
--    (each has exactly one ticket type; guarded below).
-- 2. Stop double counting sold_quantity: trigger_update_ticket_sold_quantity on
--    order_items already recounts it, so the order RPCs must not add on top.
-- 3. Recount sold_quantity with the trigger's formula.
-- 4. Keep inactive ticket types that have sales in get_ticket_type_statistics.

-- 1. Relink --------------------------------------------------------------------
WITH single_type AS (
  SELECT t.event_id, (array_agg(t.id))[1] AS ticket_type_id
  FROM ticket_types t
  WHERE t.event_id IN (
    '80434779-716e-48bd-9094-18dcc6a4f9f1',
    'a92091f4-df4e-441b-8873-1e366e490156',
    'd3b2e715-20c3-4b7d-a821-2695b657ac3d'
  )
  GROUP BY t.event_id
  HAVING count(*) = 1
)
UPDATE guests g
SET ticket_type_id = s.ticket_type_id
FROM single_type s
WHERE g.event_id = s.event_id
  AND g.ticket_type_id IS NULL
  AND COALESCE(g.special_requirements, '') <> 'private_issue';

WITH single_type AS (
  SELECT t.event_id, (array_agg(t.id))[1] AS ticket_type_id
  FROM ticket_types t
  WHERE t.event_id IN (
    '80434779-716e-48bd-9094-18dcc6a4f9f1',
    'a92091f4-df4e-441b-8873-1e366e490156',
    'd3b2e715-20c3-4b7d-a821-2695b657ac3d'
  )
  GROUP BY t.event_id
  HAVING count(*) = 1
)
UPDATE order_items oi
SET ticket_type_id = s.ticket_type_id
FROM orders o, single_type s
WHERE oi.order_id = o.id
  AND o.event_id = s.event_id
  AND oi.ticket_type_id IS NULL;

-- 2. Order RPCs without the extra sold_quantity increment ------------------------
CREATE OR REPLACE FUNCTION public.create_paid_ticket_order_with_items(p_event_id uuid, p_buyer_wallet_address text, p_buyer_name text, p_order_number text, p_ticket_details jsonb, p_total_amount numeric, p_currency text, p_transaction_hash text, p_payment_method text)
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
BEGIN
    -- Create the order
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

    -- Process each ticket type in the order
    FOR v_ticket_detail IN SELECT * FROM jsonb_array_elements(p_ticket_details)
    LOOP
        v_ticket_type_id := (v_ticket_detail->>'id')::UUID;
        v_quantity := (v_ticket_detail->>'quantity')::INTEGER;
        v_price := (v_ticket_detail->>'price')::DECIMAL(10,2);

        -- Check available quantity
        SELECT quantity - sold_quantity INTO v_available_quantity
        FROM ticket_types
        WHERE id = v_ticket_type_id;

        IF v_available_quantity IS NULL OR v_available_quantity < v_quantity THEN
            RETURN QUERY SELECT FALSE, NULL::UUID, 0, 'Insufficient tickets available'::TEXT;
            RETURN;
        END IF;

        -- Create order items and guests for this ticket type (one item per ticket)
        FOR i IN 1..v_quantity LOOP
            -- Create order item with current_owner set to buyer wallet
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

            -- Generate unique ticket number (paid pattern)
            v_ticket_number := 'TKT-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || i;

            -- Split buyer name into first and last name
            v_guest_name := COALESCE(p_buyer_name, 'Guest User');
            v_first_name := SPLIT_PART(v_guest_name, ' ', 1);
            v_last_name := CASE
                WHEN POSITION(' ' IN v_guest_name) > 0 THEN SUBSTRING(v_guest_name FROM POSITION(' ' IN v_guest_name) + 1)
                ELSE ''
            END;

            -- Create guest record
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

            -- Link the order item to the guest
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

CREATE OR REPLACE FUNCTION public.create_free_ticket_order_with_items(p_event_id uuid, p_buyer_wallet_address text, p_buyer_name text, p_order_number text, p_ticket_details jsonb)
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
BEGIN
    -- Start transaction
    BEGIN
        -- Create the order
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
            0.00, -- Free tickets have 0 total amount
            'USD',
            'free',
            'completed',
            'confirmed'
        ) RETURNING id INTO v_order_id;

        -- Process each ticket type in the order
        FOR v_ticket_detail IN SELECT * FROM jsonb_array_elements(p_ticket_details)
        LOOP
            v_ticket_type_id := (v_ticket_detail->>'id')::UUID;
            v_quantity := (v_ticket_detail->>'quantity')::INTEGER;
            v_price := (v_ticket_detail->>'price')::DECIMAL(10,2);

            -- Check available quantity
            SELECT quantity - sold_quantity INTO v_available_quantity
            FROM ticket_types
            WHERE id = v_ticket_type_id;

            IF v_available_quantity IS NULL OR v_available_quantity < v_quantity THEN
                -- Rollback transaction
                ROLLBACK;
                RETURN QUERY SELECT FALSE, NULL::UUID, 0, 'Not enough tickets available for ticket type'::TEXT;
                RETURN;
            END IF;

            -- Create order items and guests for this ticket type
            FOR i IN 1..v_quantity LOOP
                -- Create order item
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

                -- Generate ticket number
                v_ticket_number := 'TIX-' || v_order_item_id::text;

                -- Parse buyer name into first and last name
                v_guest_name := COALESCE(p_buyer_name, 'Free Ticket User');
                v_first_name := split_part(v_guest_name, ' ', 1);
                v_last_name := CASE 
                    WHEN position(' ' in v_guest_name) > 0 THEN 
                        substring(v_guest_name from position(' ' in v_guest_name) + 1)
                    ELSE 'Guest'
                END;

                -- Create guest record
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

                -- Link the order item to the guest
                UPDATE order_items 
                SET guest_id = v_guest_id 
                WHERE id = v_order_item_id;
            END LOOP;

            -- sold_quantity is maintained by trigger_update_ticket_sold_quantity on order_items

            v_ticket_claimed_count := v_ticket_claimed_count + v_quantity;
        END LOOP;

        -- Commit transaction
        RETURN QUERY SELECT TRUE, v_order_id, v_ticket_claimed_count, NULL::TEXT;

    EXCEPTION WHEN OTHERS THEN
        -- Rollback transaction on any error
        ROLLBACK;
        RETURN QUERY SELECT FALSE, NULL::UUID, 0, SQLERRM::TEXT;
    END;
END;
$function$;

-- 3. Recount sold_quantity (same formula as update_ticket_type_sold_quantity) ----
UPDATE ticket_types tt
SET sold_quantity = (
  SELECT COALESCE(SUM(oi.quantity), 0)
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.ticket_type_id = tt.id
    AND o.payment_status IN ('paid', 'completed')
)
WHERE tt.name <> 'Private Invite';

-- 4. Stats keep inactive types that have sales -----------------------------------
CREATE OR REPLACE FUNCTION public.get_ticket_type_statistics(p_event_id uuid)
 RETURNS TABLE(ticket_type_id uuid, ticket_name text, ticket_price numeric, total_quantity integer, sold_quantity integer, remaining_quantity integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        tt.id as ticket_type_id,
        tt.name as ticket_name,
        tt.price as ticket_price,
        tt.quantity as total_quantity,
        COALESCE(SUM(oi.quantity), 0)::INTEGER as sold_quantity,
        (tt.quantity - COALESCE(SUM(oi.quantity), 0))::INTEGER as remaining_quantity
    FROM ticket_types tt
    LEFT JOIN order_items oi ON oi.ticket_type_id = tt.id
        AND oi.order_id IN (
            SELECT id FROM orders WHERE event_id = p_event_id AND payment_status IN ('paid', 'completed')
        )
    WHERE tt.event_id = p_event_id
    GROUP BY tt.id, tt.name, tt.price, tt.quantity
    HAVING bool_or(tt.is_active) OR COALESCE(SUM(oi.quantity), 0) > 0
    ORDER BY tt.price DESC;
END;
$function$;
