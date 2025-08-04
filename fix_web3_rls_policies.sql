-- FIX WEB3 RLS POLICIES
-- This script fixes the RLS policies to work with Web3 authentication

-- 1. Drop the existing problematic policies
DROP POLICY IF EXISTS "Users can manage guests for own events" ON guests;
DROP POLICY IF EXISTS "Users can view guests for own events" ON guests;
DROP POLICY IF EXISTS "Event organizers can manage guests" ON guests;

-- 2. Create new policies that work with both traditional and Web3 auth
-- Policy for viewing guests (SELECT)
CREATE POLICY "Users can view guests for own events" ON guests
FOR SELECT USING (
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
        AND wu.wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      ))
    )
  )
);

-- Policy for managing guests (ALL operations)
CREATE POLICY "Users can manage guests for own events" ON guests
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
        AND wu.wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      ))
    )
  )
);

-- 3. Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'guests'; 