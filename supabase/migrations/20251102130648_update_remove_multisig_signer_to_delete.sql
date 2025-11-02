-- Update remove_multisig_signer function to actually delete the record
-- instead of just setting is_active = false
CREATE OR REPLACE FUNCTION public.remove_multisig_signer(
    p_primary_wallet_address text,
    p_signer_wallet_address text
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete the signer record from the database
    DELETE FROM wallet_multisig_signers
    WHERE primary_wallet_address = p_primary_wallet_address
    AND signer_wallet_address = p_signer_wallet_address;
    
    IF FOUND THEN
        RETURN QUERY SELECT true, 'Signer deleted successfully'::TEXT;
    ELSE
        RETURN QUERY SELECT false, 'Signer not found'::TEXT;
    END IF;
END;
$$;

