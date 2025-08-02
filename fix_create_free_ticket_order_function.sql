-- Fix the create_free_ticket_order function to work with the correct table structure
-- Drop the existing function first
DROP FUNCTION IF EXISTS create_free_ticket_order(
  p_event_id UUID,
  p_buyer_wallet_address TEXT,
  p_buyer_name TEXT,
  p_order_number TEXT,
  p_ticket_type_id UUID
);

-- Create the corrected function
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
  v_order_item_id UUID;
  v_guest_id UUID;
  v_ticket_number TEXT;
  v_tickets_claimed INTEGER := 0;
  v_error_message TEXT;
BEGIN
  -- Start transaction
  BEGIN
    -- Create the order
    INSERT INTO orders (
      event_id,
      buyer_wallet_address,
      buyer_name,
      order_number,
      total_amount,
      currency,
      payment_method,
      payment_status,
      order_status
    ) VALUES (
      p_event_id,
      p_buyer_wallet_address,
      p_buyer_name,
      p_order_number,
      0.00,
      'SOL',
      'free',
      'completed',
      'confirmed'
    ) RETURNING id INTO v_order_id;

    -- Create the order item
    INSERT INTO order_items (
      order_id,
      ticket_type_id,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      v_order_id,
      p_ticket_type_id,
      1,
      0.00,
      0.00
    ) RETURNING id INTO v_order_item_id;

    -- Create the guest record with correct column structure
    v_ticket_number := 'TIX-' || substring(v_order_item_id::text from 1 for 8);
    
    INSERT INTO guests (
      event_id,
      ticket_type_id,
      first_name,
      last_name,
      wallet_address,
      ticket_number,
      status
    ) VALUES (
      p_event_id,
      p_ticket_type_id,
      split_part(p_buyer_name, ' ', 1),
      COALESCE(split_part(p_buyer_name, ' ', 2), ''),
      p_buyer_wallet_address,
      v_ticket_number,
      'confirmed'
    ) RETURNING id INTO v_guest_id;

    -- Link the order item to the guest
    UPDATE order_items 
    SET guest_id = v_guest_id 
    WHERE id = v_order_item_id;

    v_tickets_claimed := 1;

    -- Return success
    RETURN QUERY SELECT 
      TRUE,
      v_order_id,
      p_order_number,
      v_tickets_claimed,
      NULL;

  EXCEPTION WHEN OTHERS THEN
    -- Return error
    RETURN QUERY SELECT 
      FALSE,
      NULL,
      p_order_number,
      0,
      SQLERRM;
  END;
END;
$$; 