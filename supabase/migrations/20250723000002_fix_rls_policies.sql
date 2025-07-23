-- Fix RLS Policies - Type Casting Issues
-- Run this SQL in your Supabase SQL Editor to fix the operator type mismatch errors

-- Drop existing policies that have type casting issues
DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

DROP POLICY IF EXISTS "Users can manage ticket types for own events" ON ticket_types;
DROP POLICY IF EXISTS "Users can manage venue sections for own events" ON venue_sections;
DROP POLICY IF EXISTS "Users can manage seating options for own events" ON seating_options;

DROP POLICY IF EXISTS "Event organizers can manage guests" ON guests;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Event organizers can update orders" ON orders;

DROP POLICY IF EXISTS "Users can view order items for own orders" ON order_items;
DROP POLICY IF EXISTS "Users can manage own images" ON images;
DROP POLICY IF EXISTS "Event organizers can view analytics" ON event_analytics;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Recreate policies with correct type handling
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