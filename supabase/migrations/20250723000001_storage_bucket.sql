-- Create storage bucket for event images
-- Run this SQL in your Supabase SQL Editor

-- Create the event_images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event_images',
  'event_images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy for event images
CREATE POLICY "Event images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'event_images');

-- Create storage policy for authenticated users to upload event images
CREATE POLICY "Authenticated users can upload event images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event_images' 
    AND auth.role() = 'authenticated'
  );

-- Create storage policy for users to update their own event images
CREATE POLICY "Users can update own event images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event_images' 
    AND auth.role() = 'authenticated'
    AND (auth.uid() = owner OR owner IS NULL)
  );

-- Create storage policy for users to delete their own event images
CREATE POLICY "Users can delete own event images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event_images' 
    AND auth.role() = 'authenticated'
    AND (auth.uid() = owner OR owner IS NULL)
  ); 