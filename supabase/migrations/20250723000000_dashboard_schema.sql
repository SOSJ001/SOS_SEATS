-- SOS SEATS Dashboard Schema Migration
-- Comprehensive database structure for event management system
-- Run this SQL in your Supabase SQL Editor

-- =====================================================
-- 1. EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT NOT NULL,
    venue_address TEXT,
    category TEXT,
    tags TEXT[],
    organizer TEXT,
    contact_email TEXT,
    website TEXT,
    social_media JSONB DEFAULT '{}'::jsonb,
    image_id UUID,
    is_free_event BOOLEAN DEFAULT FALSE,
    seating_type TEXT DEFAULT 'general', -- general, assigned, mixed
    total_capacity INTEGER,
    audience_type TEXT DEFAULT 'all-ages', -- all-ages, 18-plus, 21-plus, family, corporate, students
    event_visibility TEXT DEFAULT 'public', -- public, private, invite-only
    status TEXT DEFAULT 'draft', -- draft, published, live, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 2. TICKET TYPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL,
    sold_quantity INTEGER DEFAULT 0,
    benefits TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. VENUE SECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS venue_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sold_quantity INTEGER DEFAULT 0,
    seating_chart_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SEATING OPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS seating_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    allow_seat_selection BOOLEAN DEFAULT FALSE,
    max_seats_per_order INTEGER DEFAULT 4,
    reserved_seating BOOLEAN DEFAULT FALSE,
    has_seating_chart BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. GUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
    venue_section_id UUID REFERENCES venue_sections(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    wallet_address TEXT, -- For Web3 users
    ticket_number TEXT UNIQUE,
    seat_number TEXT, -- For assigned seating
    status TEXT DEFAULT 'pending', -- pending, confirmed, checked-in, cancelled
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_in_location TEXT,
    special_requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    buyer_id UUID, -- Can be traditional user or Web3 user
    buyer_wallet_address TEXT, -- For Web3 purchases
    buyer_email TEXT,
    buyer_name TEXT,
    order_number TEXT UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT, -- credit_card, crypto, bank_transfer, etc.
    payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
    transaction_hash TEXT, -- For crypto payments
    order_status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
    venue_section_id UUID REFERENCES venue_sections(id) ON DELETE SET NULL,
    guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. IMAGES TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    alt_text TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. EVENT ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS event_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    tickets_viewed INTEGER DEFAULT 0,
    tickets_added_to_cart INTEGER DEFAULT 0,
    tickets_purchased INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_wallet_address TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, success, warning, error
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON events(event_visibility);

-- Ticket types indexes
CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_is_active ON ticket_types(is_active);

-- Venue sections indexes
CREATE INDEX IF NOT EXISTS idx_venue_sections_event_id ON venue_sections(event_id);

-- Guests indexes
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_ticket_type_id ON guests(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_wallet_address ON guests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_guests_ticket_number ON guests(ticket_number);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_wallet ON orders(buyer_wallet_address);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_ticket_type_id ON order_items(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_order_items_venue_section_id ON order_items(venue_section_id);

-- Images indexes
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_file_name ON images(file_name);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_event_analytics_event_id ON event_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_event_analytics_date ON event_analytics(date);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_wallet ON notifications(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view own events" ON events
    FOR SELECT USING (
        auth.uid() = user_id OR 
        event_visibility = 'public' OR
        EXISTS (
            SELECT 1 FROM web3_users wu 
            WHERE wu.wallet_address = auth.uid()::text 
            AND wu.id = events.user_id
        )
    );

CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM web3_users wu 
            WHERE wu.wallet_address = auth.uid()::text 
            AND wu.id = events.user_id
        )
    );

CREATE POLICY "Users can update own events" ON events
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM web3_users wu 
            WHERE wu.wallet_address = auth.uid()::text 
            AND wu.id = events.user_id
        )
    );

CREATE POLICY "Users can delete own events" ON events
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM web3_users wu 
            WHERE wu.wallet_address = auth.uid()::text 
            AND wu.id = events.user_id
        )
    );

-- Ticket types policies
CREATE POLICY "Users can manage ticket types for own events" ON ticket_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = ticket_types.event_id 
            AND (auth.uid() = e.user_id OR
                 EXISTS (
                     SELECT 1 FROM web3_users wu 
                     WHERE wu.wallet_address = auth.uid()::text 
                     AND wu.id = e.user_id
                 ))
        )
    );

-- Venue sections policies
CREATE POLICY "Users can manage venue sections for own events" ON venue_sections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = venue_sections.event_id 
            AND (auth.uid() = e.user_id OR
                 EXISTS (
                     SELECT 1 FROM web3_users wu 
                     WHERE wu.wallet_address = auth.uid()::text 
                     AND wu.id = e.user_id
                 ))
        )
    );

-- Seating options policies
CREATE POLICY "Users can manage seating options for own events" ON seating_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = seating_options.event_id 
            AND (auth.uid() = e.user_id OR
                 EXISTS (
                     SELECT 1 FROM web3_users wu 
                     WHERE wu.wallet_address = auth.uid()::text 
                     AND wu.id = e.user_id
                 ))
        )
    );

-- Guests policies
CREATE POLICY "Event organizers can manage guests" ON guests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = guests.event_id 
            AND (auth.uid() = e.user_id OR
                 EXISTS (
                     SELECT 1 FROM web3_users wu 
                     WHERE wu.wallet_address = auth.uid()::text 
                     AND wu.id = e.user_id
                 ))
        )
    );

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (
        auth.uid() = buyer_id OR
        buyer_wallet_address = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = orders.event_id 
            AND (auth.uid() = e.user_id OR
                 EXISTS (
                     SELECT 1 FROM web3_users wu 
                     WHERE wu.wallet_address = auth.uid()::text 
                     AND wu.id = e.user_id
                 ))
        )
    );

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Event organizers can update orders" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = orders.event_id 
            AND (auth.uid() = e.user_id OR
                 EXISTS (
                     SELECT 1 FROM web3_users wu 
                     WHERE wu.wallet_address = auth.uid()::text 
                     AND wu.id = e.user_id
                 ))
        )
    );

-- Order items policies
CREATE POLICY "Users can view order items for own orders" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_items.order_id 
            AND (auth.uid() = o.buyer_id OR
                 o.buyer_wallet_address = auth.uid()::text OR
                 EXISTS (
                     SELECT 1 FROM events e 
                     WHERE e.id = o.event_id 
                     AND (auth.uid() = e.user_id OR
                          EXISTS (
                              SELECT 1 FROM web3_users wu 
                              WHERE wu.wallet_address = auth.uid()::text 
                              AND wu.id = e.user_id
                          ))
                 ))
        )
    );

-- Images policies
CREATE POLICY "Users can manage own images" ON images
    FOR ALL USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM web3_users wu 
            WHERE wu.wallet_address = auth.uid()::text 
            AND wu.id = images.user_id
        )
    );

-- Analytics policies
CREATE POLICY "Event organizers can view analytics" ON event_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = event_analytics.event_id 
            AND (auth.uid() = e.user_id OR
                 EXISTS (
                     SELECT 1 FROM web3_users wu 
                     WHERE wu.wallet_address = auth.uid()::text 
                     AND wu.id = e.user_id
                 ))
        )
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (
        auth.uid() = user_id OR
        user_wallet_address = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM web3_users wu 
            WHERE wu.wallet_address = auth.uid()::text 
            AND wu.id = notifications.user_id
        )
    );

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (
        auth.uid() = user_id OR
        user_wallet_address = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM web3_users wu 
            WHERE wu.wallet_address = auth.uid()::text 
            AND wu.id = notifications.user_id
        )
    );

-- =====================================================
-- FUNCTIONS FOR EVENT MANAGEMENT
-- =====================================================

-- Function to create a new event with all related data
CREATE OR REPLACE FUNCTION create_event_with_details(
    p_user_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_date DATE,
    p_time TIME,
    p_location TEXT,
    p_venue_address TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_organizer TEXT DEFAULT NULL,
    p_contact_email TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_social_media JSONB DEFAULT '{}'::jsonb,
    p_image_id UUID DEFAULT NULL,
    p_is_free_event BOOLEAN DEFAULT FALSE,
    p_seating_type TEXT DEFAULT 'general',
    p_total_capacity INTEGER DEFAULT NULL,
    p_audience_type TEXT DEFAULT 'all-ages',
    p_event_visibility TEXT DEFAULT 'public',
    p_ticket_types JSONB DEFAULT '[]'::jsonb,
    p_venue_sections JSONB DEFAULT '[]'::jsonb,
    p_seating_options JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    success BOOLEAN,
    event_id UUID,
    message TEXT
) AS $$
DECLARE
    v_event_id UUID;
    v_ticket_type JSONB;
    v_venue_section JSONB;
BEGIN
    -- Create the event
    INSERT INTO events (
        user_id, name, description, date, time, location, venue_address,
        category, tags, organizer, contact_email, website, social_media,
        image_id, is_free_event, seating_type, total_capacity,
        audience_type, event_visibility
    ) VALUES (
        p_user_id, p_name, p_description, p_date, p_time, p_location, p_venue_address,
        p_category, p_tags, p_organizer, p_contact_email, p_website, p_social_media,
        p_image_id, p_is_free_event, p_seating_type, p_total_capacity,
        p_audience_type, p_event_visibility
    ) RETURNING id INTO v_event_id;

    -- Create ticket types
    FOR v_ticket_type IN SELECT * FROM jsonb_array_elements(p_ticket_types)
    LOOP
        INSERT INTO ticket_types (
            event_id, name, description, price, quantity, benefits
        ) VALUES (
            v_event_id,
            v_ticket_type->>'name',
            v_ticket_type->>'description',
            (v_ticket_type->>'price')::DECIMAL,
            (v_ticket_type->>'quantity')::INTEGER,
            ARRAY(SELECT jsonb_array_elements_text(v_ticket_type->'benefits'))
        );
    END LOOP;

    -- Create venue sections
    FOR v_venue_section IN SELECT * FROM jsonb_array_elements(p_venue_sections)
    LOOP
        INSERT INTO venue_sections (
            event_id, name, description, capacity, price, seating_chart_data
        ) VALUES (
            v_event_id,
            v_venue_section->>'name',
            v_venue_section->>'description',
            (v_venue_section->>'capacity')::INTEGER,
            (v_venue_section->>'price')::DECIMAL,
            v_venue_section->'seating_chart_data'
        );
    END LOOP;

    -- Create seating options
    INSERT INTO seating_options (
        event_id, allow_seat_selection, max_seats_per_order, reserved_seating, has_seating_chart
    ) VALUES (
        v_event_id,
        COALESCE((p_seating_options->>'allow_seat_selection')::BOOLEAN, FALSE),
        COALESCE((p_seating_options->>'max_seats_per_order')::INTEGER, 4),
        COALESCE((p_seating_options->>'reserved_seating')::BOOLEAN, FALSE),
        COALESCE((p_seating_options->>'has_seating_chart')::BOOLEAN, FALSE)
    );

    RETURN QUERY SELECT TRUE, v_event_id, 'Event created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get event statistics
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
        SELECT id FROM orders WHERE event_id = e.id AND payment_status = 'paid'
    )
    LEFT JOIN guests g ON g.event_id = e.id
    WHERE e.id = p_event_id
    GROUP BY e.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TIX-' || to_char(now(), 'YYYYMMDD') || '-' || 
           lpad(floor(random() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to check in a guest
CREATE OR REPLACE FUNCTION check_in_guest(
    p_guest_id UUID,
    p_check_in_location TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
BEGIN
    UPDATE guests 
    SET 
        status = 'checked-in',
        check_in_time = NOW(),
        check_in_location = COALESCE(p_check_in_location, check_in_location),
        updated_at = NOW()
    WHERE id = p_guest_id AND status = 'confirmed';
    
    IF FOUND THEN
        RETURN QUERY SELECT TRUE, 'Guest checked in successfully'::TEXT;
    ELSE
        RETURN QUERY SELECT FALSE, 'Guest not found or already checked in'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_types_updated_at BEFORE UPDATE ON ticket_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_sections_updated_at BEFORE UPDATE ON venue_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seating_options_updated_at BEFORE UPDATE ON seating_options
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ticket_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON venue_sections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON seating_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON guests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_event_with_details(UUID, TEXT, TEXT, DATE, TIME, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, JSONB, UUID, BOOLEAN, TEXT, INTEGER, TEXT, TEXT, JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_ticket_number() TO authenticated;
GRANT EXECUTE ON FUNCTION check_in_guest(UUID, TEXT) TO authenticated;

-- Grant permissions to anonymous users for public data
GRANT SELECT ON events TO anon;
GRANT SELECT ON ticket_types TO anon;
GRANT SELECT ON venue_sections TO anon;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE events IS 'Main events table containing all event information';
COMMENT ON TABLE ticket_types IS 'Different ticket types and pricing for events';
COMMENT ON TABLE venue_sections IS 'Venue sections for assigned seating events';
COMMENT ON TABLE seating_options IS 'Seating configuration options for events';
COMMENT ON TABLE guests IS 'Guest/attendee information for events';
COMMENT ON TABLE orders IS 'Ticket purchase orders';
COMMENT ON TABLE order_items IS 'Individual items within orders';
COMMENT ON TABLE images IS 'Event and user images';
COMMENT ON TABLE event_analytics IS 'Event performance analytics';
COMMENT ON TABLE notifications IS 'User notifications system';

COMMENT ON FUNCTION create_event_with_details IS 'Creates a new event with all related ticket types, venue sections, and seating options';
COMMENT ON FUNCTION get_event_statistics IS 'Returns comprehensive statistics for an event';
COMMENT ON FUNCTION generate_ticket_number IS 'Generates unique ticket numbers';
COMMENT ON FUNCTION check_in_guest IS 'Checks in a guest for an event'; 