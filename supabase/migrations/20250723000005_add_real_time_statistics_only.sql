-- Add Real-Time Statistics Functions Only
-- This migration adds only the new functions needed for real-time metrics
-- without touching existing policies or tables

-- =====================================================
-- 1. CREATE NEW get_ticket_type_statistics FUNCTION
-- =====================================================

-- Function to get ticket type statistics with real-time sold quantities
CREATE OR REPLACE FUNCTION get_ticket_type_statistics(p_event_id UUID)
RETURNS TABLE(
    ticket_type_id UUID,
    ticket_name TEXT,
    ticket_price DECIMAL(10,2),
    total_quantity INTEGER,
    sold_quantity INTEGER,
    remaining_quantity INTEGER
) AS $$
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
    WHERE tt.event_id = p_event_id AND tt.is_active = TRUE
    GROUP BY tt.id, tt.name, tt.price, tt.quantity
    ORDER BY tt.price DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREATE TRIGGER FUNCTION FOR BACKWARD COMPATIBILITY
-- =====================================================

-- Function to update ticket type sold quantities when orders are placed
CREATE OR REPLACE FUNCTION update_ticket_type_sold_quantity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update sold_quantity when order_items are inserted/updated/deleted
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update sold_quantity for the ticket type
        UPDATE ticket_types
        SET sold_quantity = (
            SELECT COALESCE(SUM(oi.quantity), 0)
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.ticket_type_id = NEW.ticket_type_id
            AND o.payment_status IN ('paid', 'completed')
        )
        WHERE id = NEW.ticket_type_id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update sold_quantity for the ticket type when order item is deleted
        UPDATE ticket_types
        SET sold_quantity = (
            SELECT COALESCE(SUM(oi.quantity), 0)
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.ticket_type_id = OLD.ticket_type_id
            AND o.payment_status IN ('paid', 'completed')
        )
        WHERE id = OLD.ticket_type_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. CREATE TRIGGER
-- =====================================================

-- Create trigger to automatically update sold_quantity
DROP TRIGGER IF EXISTS trigger_update_ticket_sold_quantity ON order_items;
CREATE TRIGGER trigger_update_ticket_sold_quantity
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_ticket_type_sold_quantity();

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_ticket_type_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_ticket_type_sold_quantity() TO authenticated;

-- =====================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION get_ticket_type_statistics IS 'Returns real-time ticket type statistics with sold quantities based on actual orders (including free tickets)';
COMMENT ON FUNCTION update_ticket_type_sold_quantity IS 'Automatically updates sold_quantity in ticket_types when orders are placed (including free tickets)'; 