-- Fix for existing objects - safely handle policies and functions that might already exist
-- This migration ensures all objects are properly created without conflicts

-- =====================================================
-- 1. DROP EXISTING POLICIES (if they exist)
-- =====================================================

-- Drop ticket_types policies
DROP POLICY IF EXISTS "Users can manage ticket types for own events" ON ticket_types;
DROP POLICY IF EXISTS "Users can view ticket types for own events" ON ticket_types;

-- Drop events policies
DROP POLICY IF EXISTS "Users can manage own events" ON events;
DROP POLICY IF EXISTS "Users can view own events" ON events;

-- Drop venue_sections policies
DROP POLICY IF EXISTS "Users can manage venue sections for own events" ON venue_sections;
DROP POLICY IF EXISTS "Users can view venue sections for own events" ON venue_sections;

-- Drop seating_options policies
DROP POLICY IF EXISTS "Users can manage seating options for own events" ON seating_options;
DROP POLICY IF EXISTS "Users can view seating options for own events" ON seating_options;

-- Drop guests policies
DROP POLICY IF EXISTS "Users can manage guests for own events" ON guests;
DROP POLICY IF EXISTS "Users can view guests for own events" ON guests;

-- Drop orders policies
DROP POLICY IF EXISTS "Users can manage own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

-- Drop order_items policies
DROP POLICY IF EXISTS "Users can manage own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;

-- Drop images policies
DROP POLICY IF EXISTS "Users can manage own images" ON images;
DROP POLICY IF EXISTS "Users can view own images" ON images;

-- =====================================================
-- 2. RECREATE POLICIES SAFELY
-- =====================================================

-- Ticket Types Policies
CREATE POLICY "Users can manage ticket types for own events" ON ticket_types
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view ticket types for own events" ON ticket_types
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE user_id = auth.uid()
        )
    );

-- Events Policies
CREATE POLICY "Users can manage own events" ON events
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view own events" ON events
    FOR SELECT USING (user_id = auth.uid());

-- Venue Sections Policies
CREATE POLICY "Users can manage venue sections for own events" ON venue_sections
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view venue sections for own events" ON venue_sections
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE user_id = auth.uid()
        )
    );

-- Seating Options Policies
CREATE POLICY "Users can manage seating options for own events" ON seating_options
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view seating options for own events" ON seating_options
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE user_id = auth.uid()
        )
    );

-- Guests Policies
CREATE POLICY "Users can manage guests for own events" ON guests
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view guests for own events" ON guests
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE user_id = auth.uid()
        )
    );

-- Orders Policies (using buyer_id instead of user_id)
CREATE POLICY "Users can manage own orders" ON orders
    FOR ALL USING (buyer_id = auth.uid());

CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (buyer_id = auth.uid());

-- Order Items Policies
CREATE POLICY "Users can manage own order items" ON order_items
    FOR ALL USING (
        order_id IN (
            SELECT id FROM orders WHERE buyer_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE buyer_id = auth.uid()
        )
    );

-- Images Policies
CREATE POLICY "Users can manage own images" ON images
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view own images" ON images
    FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- 3. UPDATE FUNCTIONS WITH OR REPLACE
-- =====================================================

-- Update the get_event_statistics function to include free tickets
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
        COALESCE(SUM(oi.quantity), 0)::INTEGER as total_tickets_sold,
        COALESCE(SUM(oi.total_price), 0.00) as total_revenue,
        COUNT(g.id)::INTEGER as total_guests,
        COUNT(CASE WHEN g.status = 'checked-in' THEN 1 END)::INTEGER as checked_in_guests,
        COUNT(CASE WHEN g.status = 'pending' THEN 1 END)::INTEGER as pending_guests,
        COUNT(CASE WHEN g.status = 'cancelled' THEN 1 END)::INTEGER as cancelled_guests
    FROM events e
    LEFT JOIN order_items oi ON oi.order_id IN (
        SELECT id FROM orders WHERE event_id = e.id AND payment_status IN ('paid', 'completed')
    )
    LEFT JOIN guests g ON g.event_id = e.id
    WHERE e.id = p_event_id
    GROUP BY e.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_event_statistics(UUID) TO authenticated;

-- =====================================================
-- 5. ADD COMMENTS
-- =====================================================

COMMENT ON FUNCTION get_event_statistics IS 'Returns comprehensive statistics for an event (including free tickets)'; 