-- Add ticket loading functions for my-tickets dashboard
-- This migration adds the missing functions that the my-tickets page needs

-- =====================================================
-- 1. DROP EXISTING FUNCTIONS (if they exist)
-- =====================================================
DROP FUNCTION IF EXISTS load_orders_by_wallet(TEXT);
DROP FUNCTION IF EXISTS load_tickets_by_current_owner(TEXT);
DROP FUNCTION IF EXISTS transfer_ticket(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS list_all_orders();

-- =====================================================
-- 2. LOAD ORDERS BY WALLET FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION load_orders_by_wallet(p_wallet_address TEXT)
RETURNS TABLE(
    order_id UUID,
    event_id UUID,
    buyer_wallet_address TEXT,
    buyer_name TEXT,
    order_number TEXT,
    total_amount DECIMAL(10,2),
    currency TEXT,
    payment_method TEXT,
    payment_status TEXT,
    order_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    event_name TEXT,
    event_date DATE,
    event_location TEXT,
    ticket_type_name TEXT,
    ticket_type_price DECIMAL(10,2)
) AS $$
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
        COALESCE(tt.name, 'Standard Ticket') as ticket_type_name,
        COALESCE(tt.price, 0.00) as ticket_type_price
    FROM orders o
    LEFT JOIN events e ON e.id = o.event_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN ticket_types tt ON tt.id = oi.ticket_type_id
    WHERE o.buyer_wallet_address = p_wallet_address
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. LOAD TICKETS BY CURRENT OWNER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION load_tickets_by_current_owner(p_wallet_address TEXT)
RETURNS TABLE(
    order_id UUID,
    order_item_id UUID,
    event_id UUID,
    current_owner TEXT,
    original_buyer_wallet TEXT,
    original_buyer_name TEXT,
    order_number TEXT,
    total_amount DECIMAL(10,2),
    currency TEXT,
    payment_method TEXT,
    payment_status TEXT,
    order_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    event_name TEXT,
    event_description TEXT,
    event_date DATE,
    event_location TEXT,
    ticket_type_name TEXT,
    ticket_type_price DECIMAL(10,2),
    transfer_history TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id as order_id,
        oi.id as order_item_id,
        o.event_id,
        COALESCE(oi.current_owner, o.buyer_wallet_address) as current_owner,
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
        e.description as event_description,
        e.date as event_date,
        e.location as event_location,
        COALESCE(tt.name, 'Standard Ticket') as ticket_type_name,
        COALESCE(tt.price, 0.00) as ticket_type_price,
        CASE 
            WHEN oi.current_owner != o.buyer_wallet_address THEN 'Transferred to you'
            ELSE 'Original purchase'
        END as transfer_history
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN events e ON e.id = o.event_id
    LEFT JOIN ticket_types tt ON tt.id = oi.ticket_type_id
    WHERE (oi.current_owner = p_wallet_address OR o.buyer_wallet_address = p_wallet_address)
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. LIST ALL ORDERS FUNCTION (for debugging)
-- =====================================================
CREATE OR REPLACE FUNCTION list_all_orders()
RETURNS TABLE(
    order_id UUID,
    event_id UUID,
    buyer_wallet_address TEXT,
    buyer_name TEXT,
    order_number TEXT,
    total_amount DECIMAL(10,2),
    payment_status TEXT,
    order_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    event_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id as order_id,
        o.event_id,
        o.buyer_wallet_address,
        o.buyer_name,
        o.order_number,
        o.total_amount,
        o.payment_status,
        o.order_status,
        o.created_at,
        e.name as event_name
    FROM orders o
    LEFT JOIN events e ON e.id = o.event_id
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. ADD CURRENT_OWNER COLUMN TO ORDER_ITEMS IF NOT EXISTS
-- =====================================================
DO $$ 
BEGIN
    -- Add current_owner column to order_items if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'current_owner'
    ) THEN
        ALTER TABLE order_items ADD COLUMN current_owner TEXT;
        
        -- Initialize current_owner with buyer_wallet_address from orders
        UPDATE order_items 
        SET current_owner = o.buyer_wallet_address
        FROM orders o
        WHERE order_items.order_id = o.id 
        AND order_items.current_owner IS NULL;
    END IF;
END $$;

-- =====================================================
-- 6. TRANSFER TICKET FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION transfer_ticket(
    p_order_item_id UUID,
    p_from_wallet TEXT,
    p_to_wallet TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
BEGIN
    -- Check if the order item exists and belongs to the from_wallet
    IF NOT EXISTS (
        SELECT 1 FROM order_items 
        WHERE id = p_order_item_id 
        AND current_owner = p_from_wallet
    ) THEN
        RETURN QUERY SELECT FALSE, 'Ticket not found or not owned by sender'::TEXT;
        RETURN;
    END IF;

    -- Update the current owner
    UPDATE order_items 
    SET current_owner = p_to_wallet
    WHERE id = p_order_item_id;

    -- Log the transfer (you can add a transfer_logs table if needed)
    -- For now, we'll just return success
    
    RETURN QUERY SELECT TRUE, 'Ticket transferred successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_order_items_current_owner ON order_items(current_owner);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_wallet_address ON orders(buyer_wallet_address); 