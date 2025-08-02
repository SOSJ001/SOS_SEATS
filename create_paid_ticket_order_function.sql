-- NEW FUNCTION FOR PAID TICKETS (SOLANA)
-- Run this in your Supabase SQL editor

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_paid_ticket_order(UUID, TEXT, TEXT, TEXT, UUID, NUMERIC, TEXT, TEXT);

-- Create a function for paid tickets that bypasses RLS
CREATE OR REPLACE FUNCTION create_paid_ticket_order(
  p_event_id UUID,
  p_buyer_wallet_address TEXT,
  p_buyer_name TEXT,
  p_order_number TEXT,
  p_ticket_type_id UUID,
  p_total_amount NUMERIC,
  p_currency TEXT DEFAULT 'SOL',
  p_transaction_hash TEXT DEFAULT NULL
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
  v_guest_id UUID;
  v_order_item_id UUID;
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
    p_total_amount,
    p_currency,
    'solana',
    'completed',
    p_transaction_hash,
    'confirmed'
  ) RETURNING id INTO v_order_id;
  
  -- Create guest record (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO guests (
    event_id,
    ticket_type_id,
    first_name,
    last_name,
    wallet_address,
    email,
    phone,
    status,
    created_at
  ) VALUES (
    p_event_id,
    p_ticket_type_id,
    COALESCE(SPLIT_PART(p_buyer_name, ' ', 1), 'Guest'),
    COALESCE(SPLIT_PART(p_buyer_name, ' ', 2), 'User'),
    p_buyer_wallet_address,
    NULL,
    NULL,
    'confirmed',
    NOW()
  ) RETURNING id INTO v_guest_id;
  
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
    v_guest_id,
    1,
    p_total_amount,
    p_total_amount
  ) RETURNING id INTO v_order_item_id;
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE,
    v_order_id,
    p_order_number,
    1,
    NULL;
    
EXCEPTION WHEN OTHERS THEN
  -- Return error
  RETURN QUERY SELECT 
    FALSE,
    NULL::UUID,
    p_order_number,
    0,
    SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_paid_ticket_order(UUID, TEXT, TEXT, TEXT, UUID, NUMERIC, TEXT, TEXT) TO authenticated, anon; 