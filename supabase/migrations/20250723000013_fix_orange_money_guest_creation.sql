-- Fix Orange Money guest creation issue
-- This migration updates the create_paid_ticket_order_with_items function to create guest records for each order item

-- =====================================================
-- 1. UPDATE CREATE PAID TICKET ORDER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION create_paid_ticket_order_with_items(
    p_event_id UUID,
    p_buyer_wallet_address TEXT,
    p_buyer_name TEXT,
    p_order_number TEXT,
    p_ticket_details JSONB,
    p_total_amount DECIMAL(10,2),
    p_currency TEXT,
    p_transaction_hash TEXT
)
RETURNS TABLE(
    success BOOLEAN,
    order_id UUID,
    tickets_claimed INTEGER,
    error_message TEXT
) AS $$
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
            transaction_hash,
            order_status
        ) VALUES (
            p_event_id,
            p_buyer_wallet_address,
            p_buyer_name,
            p_order_number,
            p_total_amount,
            p_currency,
            'orange_money', -- Updated to handle Orange Money payments
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
                -- If no last name provided, use "Guest" as last name
                v_guest_name := COALESCE(p_buyer_name, 'Orange Money User');
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

            -- Update sold quantity
            UPDATE ticket_types
            SET sold_quantity = sold_quantity + v_quantity
            WHERE id = v_ticket_type_id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. UPDATE CREATE FREE TICKET ORDER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION create_free_ticket_order_with_items(
    p_event_id UUID,
    p_buyer_wallet_address TEXT,
    p_buyer_name TEXT,
    p_order_number TEXT,
    p_ticket_details JSONB
)
RETURNS TABLE(
    success BOOLEAN,
    order_id UUID,
    tickets_claimed INTEGER,
    error_message TEXT
) AS $$
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

            -- Update sold quantity
            UPDATE ticket_types
            SET sold_quantity = sold_quantity + v_quantity
            WHERE id = v_ticket_type_id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. GRANT EXECUTE PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION create_free_ticket_order_with_items(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_paid_ticket_order_with_items(UUID, TEXT, TEXT, TEXT, JSONB, DECIMAL, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON FUNCTION create_free_ticket_order_with_items IS 'Creates a free ticket order with multiple order items, guest records, and updates ticket availability';
COMMENT ON FUNCTION create_paid_ticket_order_with_items IS 'Creates a paid ticket order with multiple order items, guest records, updates ticket availability, and records payment information';
