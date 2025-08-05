-- Update the get_guests_for_user function to show current owner instead of buyer
-- This migration updates the function to join with order_items table and get current owner information

-- First drop the existing function since we're changing the return type
DROP FUNCTION IF EXISTS public.get_guests_for_user(uuid);

-- Create a helper function to get order item data without RLS restrictions
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
        oi.current_owner,
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

-- Create the main function that uses the helper function
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