-- Comprehensive RLS fix for server-side operations
-- This migration fixes both storage and images table policies

-- ========================================
-- STORAGE POLICIES FIX
-- ========================================

-- Drop existing storage policies (including the one we created earlier)
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all event image operations" ON storage.objects;

-- Create permissive storage policy for event_images bucket
CREATE POLICY "Allow all event image operations" ON storage.objects
  FOR ALL USING (bucket_id = 'event_images');

-- ========================================
-- IMAGES TABLE POLICIES FIX
-- ========================================

-- Drop existing images policies
DROP POLICY IF EXISTS "Users can manage own images" ON images;
DROP POLICY IF EXISTS "Allow all image operations" ON images;

-- Create permissive images policy for server-side operations
CREATE POLICY "Allow all image operations" ON images
    FOR ALL USING (true);

-- ========================================
-- VERIFICATION
-- ========================================

-- Check that policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('objects', 'images')
ORDER BY tablename, policyname; 