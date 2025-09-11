-- Fix Orange Money dashboard queries
-- This migration updates the database functions to handle both Web3 users (wallet_address) and Orange Money users (buyer_id)

-- =====================================================
-- 1. UPDATE LOAD TICKETS BY CURRENT OWNER FUNCTION
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
        COALESCE(oi.current_owner, o.buyer_wallet_address, o.buyer_id::TEXT) as current_owner,
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
            WHEN oi.current_owner != COALESCE(o.buyer_wallet_address, o.buyer_id::TEXT) THEN 'Transferred to you'
            ELSE 'Original purchase'
        END as transfer_history
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN events e ON e.id = o.event_id
    LEFT JOIN ticket_types tt ON tt.id = oi.ticket_type_id
    WHERE 
        -- Match by current_owner (works for both Web3 and Orange Money users)
        oi.current_owner = p_wallet_address
        OR
        -- Fallback: match by original buyer_wallet_address
        (oi.current_owner IS NULL AND o.buyer_wallet_address = p_wallet_address)
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. UPDATE LOAD ORDERS BY WALLET FUNCTION
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
-- 3. UPDATE GET GUESTS FOR USER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_guests_for_user(user_id_param uuid)
RETURNS TABLE(
    id uuid, 
    first_name text, 
    last_name text, 
    email text, 
    phone text, 
    wallet_address text, 
    ticket_number text, 
    seat_number text, 
    status text, 
    check_in_time timestamp with time zone, 
    event_id uuid, 
    event_name text, 
    event_date date,
    ticket_type_id uuid, 
    ticket_type_name text, 
    ticket_type_price numeric, 
    venue_section_id uuid, 
    venue_section_name text, 
    special_requirements text, 
    created_at timestamp with time zone,
    current_owner text,
    order_number text,
    payment_method text,
    payment_status text,
    order_item_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.first_name,
        g.last_name,
        g.email,
        g.phone,
        -- Use current_owner from order_items if available, otherwise fall back to guest wallet_address
        COALESCE(oi_data.current_owner, g.wallet_address) as wallet_address,
        g.ticket_number,
        g.seat_number,
        g.status,
        g.check_in_time,
        g.event_id,
        e.name as event_name,
        e.date as event_date,
        g.ticket_type_id,
        tt.name as ticket_type_name,
        tt.price as ticket_type_price,
        g.venue_section_id,
        vs.name as venue_section_name,
        g.special_requirements,
        g.created_at,
        COALESCE(oi_data.current_owner, g.wallet_address) as current_owner,
        oi_data.order_number,
        oi_data.payment_method,
        oi_data.payment_status,
        oi_data.order_item_id
    FROM guests g
    JOIN events e ON e.id = g.event_id
    LEFT JOIN ticket_types tt ON tt.id = g.ticket_type_id
    LEFT JOIN venue_sections vs ON vs.id = g.venue_section_id
    -- Use the helper function to get order item data without RLS issues
    LEFT JOIN LATERAL get_order_item_data_for_guest(g.id) oi_data ON true
    WHERE e.user_id = user_id_param
    ORDER BY g.created_at DESC;
END;
$function$;

-- =====================================================
-- 4. UPDATE GET ORDER ITEM DATA FOR GUEST FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_order_item_data_for_guest(guest_id_param uuid)
RETURNS TABLE(
    current_owner text,
    order_item_id uuid,
    order_number text,
    payment_method text,
    payment_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        -- Use buyer_id as current_owner for Orange Money users, wallet_address for Web3 users
        COALESCE(oi.current_owner, o.buyer_wallet_address, o.buyer_id::TEXT) as current_owner,
        oi.id as order_item_id,
        o.order_number,
        o.payment_method,
        o.payment_status
    FROM order_items oi
    LEFT JOIN orders o ON o.id = oi.order_id
    WHERE oi.guest_id = guest_id_param
    LIMIT 1;
END;
$function$;

-- =====================================================
-- 5. REMOVE UNNECESSARY FUNCTIONS
-- =====================================================
-- The "anonymous" wallet address approach makes the user ID functions unnecessary
-- Both Web3 and Orange Money users can be queried by wallet address
