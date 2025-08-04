-- Fix payment status check in validate_and_check_in_ticket function
-- This migration updates the function to use all valid payment statuses

-- =====================================================
-- 1. DROP EXISTING FUNCTION
-- =====================================================
DROP FUNCTION IF EXISTS validate_and_check_in_ticket(TEXT, UUID, TEXT);

-- =====================================================
-- 2. CREATE UPDATED FUNCTION WITH ALL VALID PAYMENT STATUSES
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
    AND o.payment_status IN ('paid', 'completed')  -- Accept both 'paid' and 'completed' statuses
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
        check_in_location = COALESCE(p_check_in_location, 'QR Scanner')
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