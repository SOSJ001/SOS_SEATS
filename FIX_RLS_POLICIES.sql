-- FIX FOR FREE TICKET RLS POLICY ISSUES
-- Run these commands in your Supabase SQL editor to fix the database permission issues

-- 1. Drop the problematic RLS policy that's blocking free ticket orders
DROP POLICY IF EXISTS "Users can create orders" ON orders;

-- 2. Create a new RLS policy that allows orders with valid buyer_id or wallet_address
CREATE POLICY "Users can create orders" ON orders
FOR INSERT 
TO public
WITH CHECK (
  -- Allow if user has a valid buyer_id (traditional auth)
  buyer_id IS NOT NULL 
  OR 
  -- Allow if user has a valid wallet_address (Web3 auth)
  buyer_wallet_address IS NOT NULL
  OR
  -- Allow if user is authenticated through Supabase auth
  auth.uid() IS NOT NULL
);

-- 3. Create a database function for free ticket claiming (optional but recommended)
CREATE OR REPLACE FUNCTION claim_free_tickets_web3(
  p_event_id UUID,
  p_buyer_id UUID,
  p_buyer_wallet_address TEXT,
  p_buyer_email TEXT,
  p_buyer_name TEXT,
  p_ticket_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_ticket_number TEXT;
  v_order_item RECORD;
  v_result JSONB;
  v_ticket_type_id TEXT;
  v_quantity INTEGER;
BEGIN
  -- Generate order number
  v_order_number := 'FREE-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || 
                   SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 9);
  
  -- Create the order (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO orders (
    event_id,
    buyer_id,
    buyer_wallet_address,
    buyer_email,
    buyer_name,
    order_number,
    total_amount,
    currency,
    payment_method,
    payment_status,
    transaction_hash,
    order_status
  ) VALUES (
    p_event_id,
    p_buyer_id,
    p_buyer_wallet_address,
    p_buyer_email,
    p_buyer_name,
    v_order_number,
    0,
    'USD',
    'free',
    'completed',
    NULL,
    'confirmed'
  ) RETURNING id INTO v_order_id;
  
  -- Create order items for each ticket
  FOR v_order_item IN SELECT * FROM jsonb_array_elements(p_ticket_data)
  LOOP
    v_ticket_type_id := v_order_item->>'ticket_type_id';
    v_quantity := (v_order_item->>'quantity')::INTEGER;
    
    -- Create order item for each ticket
    FOR i IN 1..v_quantity LOOP
      -- Generate ticket number
      SELECT generate_ticket_number() INTO v_ticket_number;
      
      -- Insert order item (bypasses RLS due to SECURITY DEFINER)
      INSERT INTO order_items (
        order_id,
        ticket_type_id,
        venue_section_id,
        guest_id,
        quantity,
        unit_price,
        total_price,
        ticket_number
      ) VALUES (
        v_order_id,
        v_ticket_type_id::INTEGER,
        NULL,
        NULL,
        1,
        0,
        0,
        v_ticket_number
      );
    END LOOP;
  END LOOP;
  
  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'tickets_claimed', jsonb_array_length(p_ticket_data)
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 4. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION claim_free_tickets_web3(UUID, UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- 5. Verify the changes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'orders' AND policyname = 'Users can create orders';

-- After running these commands, the free ticket functionality should work with database storage
-- instead of falling back to localStorage. 