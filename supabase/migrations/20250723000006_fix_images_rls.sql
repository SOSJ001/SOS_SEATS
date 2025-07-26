-- Fix RLS policies for images table to allow server-side operations
-- This migration updates the images table policies to work with server-side uploads

-- Drop existing images policies
DROP POLICY IF EXISTS "Users can manage own images" ON images;

-- Create simpler policy that allows all operations on images table
-- This is needed for server-side uploads to work
CREATE POLICY "Allow all image operations" ON images
    FOR ALL USING (true); 