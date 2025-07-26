-- Fix storage policies to allow server-side uploads
-- This migration updates the storage policies to work with both client-side and server-side uploads

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own event images" ON storage.objects;

-- Create simpler policies that allow all operations on event_images bucket
-- This is needed for server-side uploads to work
CREATE POLICY "Allow all event image operations" ON storage.objects
  FOR ALL USING (bucket_id = 'event_images'); 