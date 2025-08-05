-- Simplify the get_guests_for_user function to work with current data structure
-- Since order_items are not linked to guests, we'll use a simpler approach

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_guests_for_user(uuid);

-- Create a simplified version that works with the current data
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
        -- For now, use guest wallet_address as current owner since order_items are not linked
        g.wallet_address as wallet_address,
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
        g.wallet_address as current_owner,
        'GUEST-' || g.id::text as order_number,
        'Free' as payment_method,
        'Completed' as payment_status,
        g.id as order_item_id
    FROM guests g
    JOIN events e ON e.id = g.event_id
    LEFT JOIN ticket_types tt ON tt.id = g.ticket_type_id
    LEFT JOIN venue_sections vs ON vs.id = g.venue_section_id
    WHERE e.user_id = user_id_param
    ORDER BY g.created_at DESC;
END;
$function$; 