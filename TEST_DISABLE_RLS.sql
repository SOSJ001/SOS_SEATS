-- TEMPORARY TEST: Disable RLS on orders table for debugging
-- WARNING: This is for testing only - don't use in production!

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'orders';

-- Temporarily disable RLS for testing
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Test insert without RLS
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
  'a1904f85-6b1e-4265-ae88-84fefc47e506'::UUID,
  NULL,
  '0x1234567890abcdef',
  'test@example.com',
  'Test User',
  'FREE-TEST-NO-RLS',
  0,
  'USD',
  'free',
  'completed',
  NULL,
  'confirmed'
) RETURNING id;

-- Re-enable RLS after testing
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY; 