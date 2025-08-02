-- BYPASS RLS FUNCTION FOR FREE TICKET ORDERS (FIXED)
-- Run this in your Supabase SQL editor

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_free_ticket_order(UUID, TEXT, TEXT, TEXT, UUID);

-- Create a function that bypasses RLS (FIXED - PostgREST compatible)
CREATE OR REPLACE FUNCTION create_free_ticket_order(
  p_event_id UUID,
  p_buyer_wallet_address TEXT,
  p_buyer_name TEXT,
  p_order_number TEXT,
  p_ticket_type_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  order_id UUID,
  order_number TEXT,
  tickets_claimed INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
BEGIN
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
    NULL,
    p_buyer_wallet_address,
    NULL,
    p_buyer_name,
    p_order_number,
    0,
    'USD',
    'free',
    'completed',
    NULL,
    'confirmed'
  ) RETURNING id INTO v_order_id;
  
  -- Create order item (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO order_items (
    order_id,
    ticket_type_id,
    venue_section_id,
    guest_id,
    quantity,
    unit_price,
    total_price
  ) VALUES (
    v_order_id,
    p_ticket_type_id,
    NULL,
    NULL,
    1,
    0,
    0
  );
  
  -- Return success result as a table row
  RETURN QUERY SELECT 
    true::BOOLEAN as success,
    v_order_id as order_id,
    p_order_number as order_number,
    1 as tickets_claimed,
    NULL::TEXT as error_message;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result as a table row
    RETURN QUERY SELECT 
      false::BOOLEAN as success,
      NULL::UUID as order_id,
      p_order_number as order_number,
      0 as tickets_claimed,
      SQLERRM as error_message;
END;
$$;

-- Create a function to load orders by wallet address (bypasses RLS)
CREATE OR REPLACE FUNCTION load_orders_by_wallet(
  p_wallet_address TEXT
)
RETURNS TABLE(
  order_id UUID,
  event_id UUID,
  buyer_wallet_address TEXT,
  buyer_name TEXT,
  order_number TEXT,
  total_amount DECIMAL,
  currency TEXT,
  payment_method TEXT,
  payment_status TEXT,
  order_status TEXT,
  created_at TIMESTAMPTZ,
  event_name TEXT,
  event_date DATE,
  event_location TEXT,
  ticket_type_name TEXT,
  ticket_type_price DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.event_id,
    o.buyer_wallet_address,
    o.buyer_name,
    o.order_number,
    o.total_amount,
    o.currency,
    o.payment_method,
    o.payment_status,
    o.order_status,
    o.created_at,
    e.name as event_name,
    e.date as event_date,
    e.location as event_location,
    tt.name as ticket_type_name,
    tt.price as ticket_type_price
  FROM orders o
  LEFT JOIN events e ON o.event_id = e.id
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN ticket_types tt ON oi.ticket_type_id = tt.id
  WHERE o.buyer_wallet_address = p_wallet_address
  ORDER BY o.created_at DESC;
END;
$$;

-- Create a function to get a specific order by ID (bypasses RLS)
CREATE OR REPLACE FUNCTION get_order_by_id(
  p_order_id UUID
)
RETURNS TABLE(
  order_id UUID,
  event_id UUID,
  buyer_wallet_address TEXT,
  buyer_name TEXT,
  order_number TEXT,
  total_amount DECIMAL,
  currency TEXT,
  payment_method TEXT,
  payment_status TEXT,
  order_status TEXT,
  created_at TIMESTAMPTZ,
  event_name TEXT,
  event_date DATE,
  event_location TEXT,
  ticket_type_name TEXT,
  ticket_type_price DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.event_id,
    o.buyer_wallet_address,
    o.buyer_name,
    o.order_number,
    o.total_amount,
    o.currency,
    o.payment_method,
    o.payment_status,
    o.order_status,
    o.created_at,
    e.name as event_name,
    e.date as event_date,
    e.location as event_location,
    tt.name as ticket_type_name,
    tt.price as ticket_type_price
  FROM orders o
  LEFT JOIN events e ON o.event_id = e.id
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN ticket_types tt ON oi.ticket_type_id = tt.id
  WHERE o.id = p_order_id;
END;
$$;

-- Create a function to list all orders for debugging (bypasses RLS)
CREATE OR REPLACE FUNCTION list_all_orders()
RETURNS TABLE(
  order_id UUID,
  order_number TEXT,
  buyer_wallet_address TEXT,
  buyer_name TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.order_number,
    o.buyer_wallet_address,
    o.buyer_name,
    o.payment_method,
    o.created_at
  FROM orders o
  ORDER BY o.created_at DESC
  LIMIT 20;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_free_ticket_order(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated, anon;

-- Test the function
SELECT * FROM create_free_ticket_order(
  'a1904f85-6b1e-4265-ae88-84fefc47e506'::UUID,
  '0x1234567890abcdef',
  'Test User',
  'FREE-TEST-FIXED',
  '99ead1ce-a9ca-4fe2-9d6a-be91de406044'::UUID
); 