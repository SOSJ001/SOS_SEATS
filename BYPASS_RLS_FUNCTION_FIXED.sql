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
    0,
    'USD',
    'free',
    'completed',
    NULL,
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
    0,
    0
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
GRANT EXECUTE ON FUNCTION create_free_ticket_order(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated, anon;

-- Test the function
-- SELECT * FROM create_free_ticket_order(
--   '53b886fe-6821-45c1-b529-87358b17aaf5'::UUID,
--   '3ZPcjHB48wwrHmpj1pMkH3ohbEaajpTVHZJuAw4TwVzL',
--   'Test User',
--   'TEST-123',
--   'your-ticket-type-id'::UUID
-- );

-- NEW FUNCTION FOR PAID TICKETS (SOLANA)
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

-- Drop existing function first (since we're changing the return type)
DROP FUNCTION IF EXISTS load_orders_by_wallet(TEXT);

-- Create a function to load orders by wallet address (bypasses RLS)
CREATE OR REPLACE FUNCTION load_orders_by_wallet(
  p_wallet_address TEXT
)
RETURNS TABLE(
  order_id UUID,
  order_item_id UUID,
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
  ticket_type_price DECIMAL,
  current_owner TEXT,
  has_transferred BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    oi.id as order_item_id,
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
    tt.price as ticket_type_price,
    get_current_ticket_owner(oi.id) as current_owner,
    has_ticket_been_transferred(oi.id) as has_transferred
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

-- Create order transfers table to track ticket transfers
CREATE TABLE IF NOT EXISTS order_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    from_wallet_address TEXT NOT NULL,
    to_wallet_address TEXT NOT NULL,
    transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transfer_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_order_transfers_order_item_id ON order_transfers(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_transfers_to_wallet ON order_transfers(to_wallet_address);

-- Enable RLS
ALTER TABLE order_transfers ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_transfers
DROP POLICY IF EXISTS "Users can view transfers for their tickets" ON order_transfers;
DROP POLICY IF EXISTS "Users can create transfers for their tickets" ON order_transfers;

CREATE POLICY "Users can view transfers for their tickets" ON order_transfers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.id = order_transfers.order_item_id
            AND (o.buyer_wallet_address = auth.uid()::text OR
                 order_transfers.to_wallet_address = auth.uid()::text)
        )
    );

CREATE POLICY "Users can create transfers for their tickets" ON order_transfers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.id = order_transfers.order_item_id
            AND o.buyer_wallet_address = auth.uid()::text
        )
    );

-- Function to get current ticket owner (original buyer or latest transfer recipient)
CREATE OR REPLACE FUNCTION get_current_ticket_owner(p_order_item_id UUID)
RETURNS TEXT AS $$
DECLARE
    current_owner TEXT;
BEGIN
    -- Get the latest transfer for this order item
    SELECT to_wallet_address INTO current_owner
    FROM order_transfers
    WHERE order_item_id = p_order_item_id
    ORDER BY transferred_at DESC
    LIMIT 1;
    
    -- If no transfer found, return the original buyer
    IF current_owner IS NULL THEN
        SELECT o.buyer_wallet_address INTO current_owner
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.id = p_order_item_id;
    END IF;
    
    RETURN current_owner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to transfer a ticket
CREATE OR REPLACE FUNCTION transfer_ticket(
    p_order_item_id UUID,
    p_from_wallet TEXT,
    p_to_wallet TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_owner TEXT;
BEGIN
    -- Get current owner
    SELECT get_current_ticket_owner(p_order_item_id) INTO current_owner;
    
    -- Verify the from_wallet is the current owner
    IF current_owner != p_from_wallet THEN
        RETURN FALSE;
    END IF;
    
    -- Create transfer record
    INSERT INTO order_transfers (
        order_item_id,
        from_wallet_address,
        to_wallet_address,
        transfer_reason
    ) VALUES (
        p_order_item_id,
        p_from_wallet,
        p_to_wallet,
        p_reason
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to load tickets by current owner (including transferred tickets)
CREATE OR REPLACE FUNCTION load_tickets_by_current_owner(
  p_wallet_address TEXT
)
RETURNS TABLE(
  order_id UUID,
  order_item_id UUID,
  event_id UUID,
  original_buyer_wallet TEXT,
  original_buyer_name TEXT,
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
  ticket_type_price DECIMAL,
  current_owner TEXT,
  transfer_history TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    oi.id as order_item_id,
    o.event_id,
    o.buyer_wallet_address as original_buyer_wallet,
    o.buyer_name as original_buyer_name,
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
    tt.price as ticket_type_price,
    get_current_ticket_owner(oi.id) as current_owner,
    CASE 
      WHEN o.buyer_wallet_address = p_wallet_address THEN 'Original Owner'
      ELSE 'Transferred to you'
    END as transfer_history
  FROM orders o
  LEFT JOIN events e ON o.event_id = e.id
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN ticket_types tt ON oi.ticket_type_id = tt.id
  WHERE get_current_ticket_owner(oi.id) = p_wallet_address
  ORDER BY o.created_at DESC;
END;
$$;

-- Function to check if a ticket has been transferred
CREATE OR REPLACE FUNCTION has_ticket_been_transferred(p_order_item_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM order_transfers 
        WHERE order_item_id = p_order_item_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 