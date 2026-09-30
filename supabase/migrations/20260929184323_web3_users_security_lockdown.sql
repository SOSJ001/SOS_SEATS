-- web3_users security lockdown.
-- No direct browser writes to web3_users. SELECT is kept: policies on notifications,
-- guests, order_items, event_analytics and wallet_multisig_* read it as the caller.

DROP POLICY IF EXISTS "Allow wallet connection" ON public.web3_users;
DROP POLICY IF EXISTS "Users can update own web3 profile" ON public.web3_users;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.web3_users FROM anon, authenticated;

ALTER VIEW public.web3_user_profiles SET (security_invoker = true);
REVOKE ALL ON public.web3_user_profiles FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.update_web3_user_profile(text, text, text, text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_web3_user(
  wallet_address_param text,
  username_param text DEFAULT NULL,
  display_name_param text DEFAULT NULL
) RETURNS TABLE(success boolean, user_id uuid, username text, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_user_id uuid;
  norm text := nullif(lower(trim(username_param)), '');
BEGIN
  IF EXISTS (SELECT 1 FROM web3_users wu WHERE wu.wallet_address = wallet_address_param) THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, 'Wallet already exists'::text;
    RETURN;
  END IF;

  IF norm IS NOT NULL AND norm !~ '^[a-z0-9_]{3,20}$' THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, 'Invalid username'::text;
    RETURN;
  END IF;

  IF norm IS NOT NULL AND EXISTS (SELECT 1 FROM web3_users wu WHERE lower(wu.username) = norm) THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, 'Username already taken'::text;
    RETURN;
  END IF;

  INSERT INTO web3_users (wallet_address, username, display_name)
  VALUES (wallet_address_param, norm, display_name_param)
  RETURNING id INTO new_user_id;

  RETURN QUERY SELECT true, new_user_id, norm, 'User created successfully'::text;
END;
$$;

DROP EXTENSION IF EXISTS pg_graphql;
