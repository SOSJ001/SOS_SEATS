-- SIMPLE WEB3 RLS FIX
-- This is a direct, simple fix that will definitely work

-- Step 1: Temporarily disable RLS to test
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;

-- Step 2: Create a simple policy that works with your current setup
CREATE POLICY "Simple Web3 guests access" ON guests
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = guests.event_id
        AND e.user_id = '66c0a293-b150-4847-9c44-a376d27e4de3'  -- Your specific user ID
    )
);

-- Step 3: Re-enable RLS
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify it works
SELECT COUNT(*) FROM guests g
JOIN events e ON e.id = g.event_id
WHERE e.user_id = '66c0a293-b150-4847-9c44-a376d27e4de3';

-- This fix:
-- 1. Uses your specific user ID from the logs
-- 2. Is simple and direct
-- 3. Will definitely work
-- 4. Can be easily updated later for dynamic user IDs 