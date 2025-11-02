-- Function to mark a notification as read
-- This bypasses RLS by using SECURITY DEFINER and wallet address verification
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(
    p_notification_id UUID,
    p_user_wallet_address TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_user_wallet TEXT;
BEGIN
    -- Verify the notification belongs to this wallet address
    SELECT user_wallet_address INTO v_notification_user_wallet
    FROM public.notifications
    WHERE id = p_notification_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Notification not found.'::TEXT;
        RETURN;
    END IF;

    IF v_notification_user_wallet IS DISTINCT FROM p_user_wallet_address THEN
        RETURN QUERY SELECT FALSE, 'You can only mark your own notifications as read.'::TEXT;
        RETURN;
    END IF;

    -- Update the notification
    UPDATE public.notifications
    SET is_read = TRUE
    WHERE id = p_notification_id;

    IF FOUND THEN
        RETURN QUERY SELECT TRUE, 'Notification marked as read.'::TEXT;
    ELSE
        RETURN QUERY SELECT FALSE, 'Failed to update notification.'::TEXT;
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.mark_notification_as_read(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_as_read(UUID, TEXT) TO anon;

