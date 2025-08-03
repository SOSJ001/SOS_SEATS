-- Fix the get_event_statistics function bug
-- The current function has a cartesian product issue between order_items and guests
-- This causes incorrect ticket counts (3 orders × 3 guests = 9 tickets instead of 3)

-- Drop and recreate the function to fix the cartesian product issue
DROP FUNCTION IF EXISTS get_event_statistics(UUID);

CREATE OR REPLACE FUNCTION get_event_statistics(p_event_id UUID)
RETURNS TABLE(
    total_tickets_sold INTEGER,
    total_revenue DECIMAL(10,2),
    total_guests INTEGER,
    checked_in_guests INTEGER,
    pending_guests INTEGER,
    cancelled_guests INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Calculate tickets sold separately to avoid cartesian product
        (SELECT COALESCE(SUM(oi.quantity), 0)::INTEGER
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.event_id = p_event_id AND o.payment_status IN ('paid', 'completed')
        ) as total_tickets_sold,
        
        -- Calculate revenue separately
        (SELECT COALESCE(SUM(oi.total_price), 0.00)
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.event_id = p_event_id AND o.payment_status IN ('paid', 'completed')
        ) as total_revenue,
        
        -- Calculate guest statistics separately
        (SELECT COUNT(g.id)::INTEGER
         FROM guests g
         WHERE g.event_id = p_event_id
        ) as total_guests,
        
        (SELECT COUNT(CASE WHEN g.status = 'checked-in' THEN 1 END)::INTEGER
         FROM guests g
         WHERE g.event_id = p_event_id
        ) as checked_in_guests,
        
        (SELECT COUNT(CASE WHEN g.status = 'pending' THEN 1 END)::INTEGER
         FROM guests g
         WHERE g.event_id = p_event_id
        ) as pending_guests,
        
        (SELECT COUNT(CASE WHEN g.status = 'cancelled' THEN 1 END)::INTEGER
         FROM guests g
         WHERE g.event_id = p_event_id
        ) as cancelled_guests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_event_statistics(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_event_statistics IS 'Returns comprehensive statistics for an event (including free tickets) - Fixed cartesian product bug'; 