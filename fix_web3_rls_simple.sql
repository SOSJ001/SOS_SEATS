-- SIMPLE FIX FOR WEB3 RLS POLICIES
-- This creates a simpler, more reliable fix for Web3 authentication

-- 1. Drop the existing problematic policies
DROP POLICY IF EXISTS "Users can manage guests for own events" ON guests;
DROP POLICY IF EXISTS "Users can view guests for own events" ON guests;
DROP POLICY IF EXISTS "Event organizers can manage guests" ON guests;

-- 2. Create a simple policy that works with Web3 auth
-- This policy allows access if the event belongs to a user with the same wallet address
CREATE POLICY "Web3 users can access their event guests" ON guests
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM events e
    JOIN web3_users wu ON e.user_id = wu.id
    WHERE e.id = guests.event_id
    AND wu.wallet_address = (
      SELECT wallet_address 
      FROM web3_users 
      WHERE wallet_address = COALESCE(
        auth.jwt() ->> 'wallet_address',
        current_setting('request.jwt.claims', true)::json->>'wallet_address'
      )
      LIMIT 1
    )
  )
);

-- 3. Alternative: Create a function-based policy that's more flexible
CREATE OR REPLACE FUNCTION check_web3_user_access(event_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_wallet TEXT;
  event_owner_wallet TEXT;
BEGIN
  -- Get current user's wallet address from JWT
  user_wallet := COALESCE(
    auth.jwt() ->> 'wallet_address',
    current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );
  
  -- If no wallet in JWT, try to get from auth.uid() (traditional auth)
  IF user_wallet IS NULL AND auth.uid() IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = event_id AND e.user_id = auth.uid()
    );
  END IF;
  
  -- Get event owner's wallet address
  SELECT wu.wallet_address INTO event_owner_wallet
  FROM events e
  JOIN web3_users wu ON e.user_id = wu.id
  WHERE e.id = event_id;
  
  -- Return true if wallets match
  RETURN user_wallet = event_owner_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create policy using the function
CREATE POLICY "Flexible user access to guests" ON guests
FOR ALL USING (check_web3_user_access(event_id));

-- 5. Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'guests'; 