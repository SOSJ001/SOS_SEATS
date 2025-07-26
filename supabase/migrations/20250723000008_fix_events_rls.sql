-- Fix RLS policies for events table to allow Web3 users to see their events
-- This migration updates the events table policies to work with Web3 users

-- Drop existing events policies
DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

-- Create new events policies that work with both traditional and Web3 users
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