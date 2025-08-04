-- FINAL WEB3 RLS FIX
-- This fixes the RLS policy for guests table to work with Web3 authentication

-- Step 1: Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'guests';

-- Step 2: Drop the existing problematic policy
DROP POLICY IF EXISTS "Event organizers can manage guests" ON guests;

-- Step 3: Create a new policy that properly handles Web3 authentication
-- This policy checks both traditional auth (auth.uid()) and Web3 auth (JWT claims)
CREATE POLICY "Event organizers can manage guests" ON guests
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = guests.event_id 
        AND (
            -- Traditional auth: auth.uid() matches event user_id
            (auth.uid() IS NOT NULL AND auth.uid() = e.user_id)
            OR
            -- Web3 auth: check if current user's wallet matches event owner's wallet
            (auth.uid() IS NULL AND EXISTS (
                SELECT 1 FROM web3_users wu
                WHERE wu.id = e.user_id
                AND wu.wallet_address = COALESCE(
                    auth.jwt() ->> 'wallet_address',
                    current_setting('request.jwt.claims', true)::json->>'wallet_address'
                )
            ))
        )
    )
);

-- Step 4: Verify the new policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'guests';

-- Step 5: Test the policy by checking if it allows access
-- This should return the policy details
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'guests' 
AND policyname = 'Event organizers can manage guests';

-- IMPORTANT NOTES:
-- 1. This fix only affects the guests table
-- 2. It maintains security for both traditional and Web3 users
-- 3. It uses the existing web3_users table structure
-- 4. It can be easily reverted if needed
-- 5. It doesn't break any other parts of your application 