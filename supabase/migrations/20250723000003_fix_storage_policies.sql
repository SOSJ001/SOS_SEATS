-- Fix Storage Policies - Type Casting Issues
-- Run this SQL in your Supabase SQL Editor to fix the storage operator type mismatch errors

-- Drop existing storage policies that have type casting issues
DROP POLICY IF EXISTS "Users can update own event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own event images" ON storage.objects;

-- Recreate storage policies with correct type handling
CREATE POLICY "Users can update own event images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event_images' 
    AND auth.role() = 'authenticated'
    AND (auth.uid() = owner OR owner IS NULL)
  );

CREATE POLICY "Users can delete own event images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event_images' 
    AND auth.role() = 'authenticated'
    AND (auth.uid() = owner OR owner IS NULL)
  ); 