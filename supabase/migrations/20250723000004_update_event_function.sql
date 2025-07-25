-- Update create_event_with_details function to handle status parameter
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS create_event_with_details(UUID, TEXT, TEXT, DATE, TIME, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, JSONB, UUID, BOOLEAN, TEXT, INTEGER, TEXT, TEXT, JSONB, JSONB, JSONB);

-- Recreate the function with status parameter
CREATE OR REPLACE FUNCTION create_event_with_details(
    p_user_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_date DATE,
    p_time TIME,
    p_location TEXT,
    p_venue_address TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_organizer TEXT DEFAULT NULL,
    p_contact_email TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_social_media JSONB DEFAULT '{}'::jsonb,
    p_image_id UUID DEFAULT NULL,
    p_is_free_event BOOLEAN DEFAULT FALSE,
    p_seating_type TEXT DEFAULT 'general',
    p_total_capacity INTEGER DEFAULT NULL,
    p_audience_type TEXT DEFAULT 'all-ages',
    p_event_visibility TEXT DEFAULT 'public',
    p_status TEXT DEFAULT 'draft',
    p_ticket_types JSONB DEFAULT '[]'::jsonb,
    p_venue_sections JSONB DEFAULT '[]'::jsonb,
    p_seating_options JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    success BOOLEAN,
    event_id UUID,
    message TEXT
) AS $$
DECLARE
    v_event_id UUID;
    v_ticket_type JSONB;
    v_venue_section JSONB;
BEGIN
    -- Create the event with status
    INSERT INTO events (
        user_id, name, description, date, time, location, venue_address,
        category, tags, organizer, contact_email, website, social_media,
        image_id, is_free_event, seating_type, total_capacity,
        audience_type, event_visibility, status, published_at
    ) VALUES (
        p_user_id, p_name, p_description, p_date, p_time, p_location, p_venue_address,
        p_category, p_tags, p_organizer, p_contact_email, p_website, p_social_media,
        p_image_id, p_is_free_event, p_seating_type, p_total_capacity,
        p_audience_type, p_event_visibility, p_status,
        CASE WHEN p_status = 'published' THEN NOW() ELSE NULL END
    ) RETURNING id INTO v_event_id;

    -- Create ticket types
    FOR v_ticket_type IN SELECT * FROM jsonb_array_elements(p_ticket_types)
    LOOP
        INSERT INTO ticket_types (
            event_id, name, description, price, quantity, benefits
        ) VALUES (
            v_event_id,
            v_ticket_type->>'name',
            v_ticket_type->>'description',
            (v_ticket_type->>'price')::DECIMAL,
            (v_ticket_type->>'quantity')::INTEGER,
            ARRAY(SELECT jsonb_array_elements_text(v_ticket_type->'benefits'))
        );
    END LOOP;

    -- Create venue sections
    FOR v_venue_section IN SELECT * FROM jsonb_array_elements(p_venue_sections)
    LOOP
        INSERT INTO venue_sections (
            event_id, name, description, capacity, price, seating_chart_data
        ) VALUES (
            v_event_id,
            v_venue_section->>'name',
            v_venue_section->>'description',
            (v_venue_section->>'capacity')::INTEGER,
            (v_venue_section->>'price')::DECIMAL,
            v_venue_section->'seating_chart_data'
        );
    END LOOP;

    -- Create seating options
    INSERT INTO seating_options (
        event_id, allow_seat_selection, max_seats_per_order, reserved_seating, has_seating_chart
    ) VALUES (
        v_event_id,
        COALESCE((p_seating_options->>'allow_seat_selection')::BOOLEAN, FALSE),
        COALESCE((p_seating_options->>'max_seats_per_order')::INTEGER, 4),
        COALESCE((p_seating_options->>'reserved_seating')::BOOLEAN, FALSE),
        COALESCE((p_seating_options->>'has_seating_chart')::BOOLEAN, FALSE)
    );

    RETURN QUERY SELECT TRUE, v_event_id, 'Event created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the grant permissions for the new function signature
GRANT EXECUTE ON FUNCTION create_event_with_details(UUID, TEXT, TEXT, DATE, TIME, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, JSONB, UUID, BOOLEAN, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB) TO authenticated; 