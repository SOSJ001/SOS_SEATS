-- Add ticket validation and check-in function for QR scanner
-- This migration adds the function needed for the QR scanner to validate tickets

-- =====================================================
-- 1. DROP EXISTING FUNCTION (if it exists)
-- =====================================================
DROP FUNCTION IF EXISTS validate_and_check_in_ticket(TEXT, UUID, TEXT);

-- =====================================================
-- 2. VALIDATE AND CHECK IN TICKET FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION validate_and_check_in_ticket(
    p_wallet_address TEXT,
    p_event_id UUID,
    p_check_in_location TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    ticket_info JSONB
) AS $$
DECLARE
    v_order_item_id UUID;
    v_ticket_data JSONB;
    v_check_in_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check if ticket exists and is valid for this event
    SELECT oi.id, oi.check_in_time
    INTO v_order_item_id, v_check_in_time
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.current_owner = p_wallet_address
    AND o.event_id = p_event_id
    AND o.payment_status = 'paid'
    AND oi.check_in_time IS NULL; -- Not already checked in
    
    -- If ticket not found or already checked in
    IF v_order_item_id IS NULL THEN
        -- Check if ticket exists but already checked in
        SELECT oi.id, oi.check_in_time
        INTO v_order_item_id, v_check_in_time
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.current_owner = p_wallet_address
        AND o.event_id = p_event_id;
        
        IF v_order_item_id IS NOT NULL AND v_check_in_time IS NOT NULL THEN
            RETURN QUERY SELECT 
                FALSE, 
                'Ticket already checked in at ' || v_check_in_time::TEXT,
                NULL::JSONB;
            RETURN;
        ELSE
            RETURN QUERY SELECT 
                FALSE, 
                'Invalid ticket or ticket not found for this event',
                NULL::JSONB;
            RETURN;
        END IF;
    END IF;
    
    -- Get ticket information for response
    SELECT jsonb_build_object(
        'order_item_id', oi.id,
        'order_id', o.id,
        'order_number', o.order_number,
        'event_name', e.name,
        'event_date', e.date,
        'event_location', e.location,
        'ticket_type_name', COALESCE(tt.name, 'Standard Ticket'),
        'ticket_type_price', COALESCE(tt.price, 0.00),
        'original_buyer_name', o.buyer_name,
        'original_buyer_wallet', o.buyer_wallet_address,
        'current_owner', oi.current_owner,
        'payment_method', o.payment_method,
        'total_amount', o.total_amount,
        'currency', o.currency,
        'is_transferred', oi.current_owner != o.buyer_wallet_address
    )
    INTO v_ticket_data
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN events e ON e.id = o.event_id
    LEFT JOIN ticket_types tt ON tt.id = oi.ticket_type_id
    WHERE oi.id = v_order_item_id;
    
    -- Check in the ticket
    UPDATE order_items 
    SET 
        check_in_time = NOW(),
        check_in_location = COALESCE(p_check_in_location, 'QR Scanner'),
        updated_at = NOW()
    WHERE id = v_order_item_id;
    
    -- Return success with ticket information
    RETURN QUERY SELECT 
        TRUE, 
        'Ticket checked in successfully',
        v_ticket_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION validate_and_check_in_ticket(TEXT, UUID, TEXT) TO authenticated;

-- =====================================================
-- 4. ADD CHECK_IN_TIME AND CHECK_IN_LOCATION COLUMNS TO ORDER_ITEMS
-- =====================================================
-- Add check_in_time column to order_items if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'check_in_time'
    ) THEN
        ALTER TABLE order_items ADD COLUMN check_in_time TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add check_in_location column to order_items if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'check_in_location'
    ) THEN
        ALTER TABLE order_items ADD COLUMN check_in_location TEXT;
    END IF;
END $$;

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_order_items_check_in_time ON order_items(check_in_time);
CREATE INDEX IF NOT EXISTS idx_order_items_event_check_in ON order_items(order_id, check_in_time); 