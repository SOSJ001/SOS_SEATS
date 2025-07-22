-- Web3 Authentication Migration for SOS SEATS
-- Run this SQL in your Supabase SQL Editor

-- 1. Create Web3 users table
CREATE TABLE IF NOT EXISTS web3_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sign_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_web3_users_wallet_address ON web3_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_web3_users_username ON web3_users(username);

-- 3. Enable RLS
ALTER TABLE web3_users ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view own web3 profile" ON web3_users
    FOR SELECT USING (auth.uid()::text = wallet_address OR auth.uid()::text = id::text);

CREATE POLICY "Users can update own web3 profile" ON web3_users
    FOR UPDATE USING (auth.uid()::text = wallet_address OR auth.uid()::text = id::text);

CREATE POLICY "Allow wallet connection" ON web3_users
    FOR INSERT WITH CHECK (true);

-- 5. Create function to check if wallet exists
CREATE OR REPLACE FUNCTION check_wallet_exists(wallet_address_param TEXT)
RETURNS TABLE(
    exists BOOLEAN,
    user_id UUID,
    username TEXT,
    display_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE as exists,
        wu.id as user_id,
        wu.username,
        wu.display_name
    FROM web3_users wu
    WHERE wu.wallet_address = wallet_address_param
    LIMIT 1;
    
    -- If no user found, return false
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to create new Web3 user
CREATE OR REPLACE FUNCTION create_web3_user(
    wallet_address_param TEXT,
    username_param TEXT DEFAULT NULL,
    display_name_param TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    user_id UUID,
    username TEXT,
    message TEXT
) AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Check if wallet already exists
    IF EXISTS (SELECT 1 FROM web3_users WHERE wallet_address = wallet_address_param) THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Wallet already exists'::TEXT;
        RETURN;
    END IF;
    
    -- Check if username is taken (if provided)
    IF username_param IS NOT NULL AND EXISTS (SELECT 1 FROM web3_users WHERE username = username_param) THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Username already taken'::TEXT;
        RETURN;
    END IF;
    
    -- Create new user
    INSERT INTO web3_users (wallet_address, username, display_name)
    VALUES (wallet_address_param, username_param, display_name_param)
    RETURNING id INTO new_user_id;
    
    RETURN QUERY SELECT TRUE, new_user_id, username_param, 'User created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to update user profile
CREATE OR REPLACE FUNCTION update_web3_user_profile(
    wallet_address_param TEXT,
    username_param TEXT DEFAULT NULL,
    display_name_param TEXT DEFAULT NULL,
    avatar_url_param TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
BEGIN
    UPDATE web3_users 
    SET 
        username = COALESCE(username_param, username),
        display_name = COALESCE(display_name_param, display_name),
        avatar_url = COALESCE(avatar_url_param, avatar_url),
        updated_at = NOW()
    WHERE wallet_address = wallet_address_param;
    
    IF FOUND THEN
        RETURN QUERY SELECT TRUE, 'Profile updated successfully'::TEXT;
    ELSE
        RETURN QUERY SELECT FALSE, 'User not found'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to record sign in
CREATE OR REPLACE FUNCTION record_web3_sign_in(wallet_address_param TEXT)
RETURNS TABLE(
    success BOOLEAN,
    user_id UUID,
    username TEXT
) AS $$
BEGIN
    UPDATE web3_users 
    SET last_sign_in_at = NOW()
    WHERE wallet_address = wallet_address_param;
    
    RETURN QUERY
    SELECT 
        TRUE as success,
        wu.id as user_id,
        wu.username
    FROM web3_users wu
    WHERE wu.wallet_address = wallet_address_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create view for user profile data
CREATE OR REPLACE VIEW web3_user_profiles AS
SELECT 
    wu.id,
    wu.wallet_address,
    wu.username,
    wu.display_name,
    wu.avatar_url,
    wu.created_at,
    wu.last_sign_in_at,
    wu.is_active,
    wu.metadata
FROM web3_users wu
WHERE wu.is_active = true;

-- 10. Grant permissions
GRANT SELECT ON web3_user_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_wallet_exists(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_web3_user(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_web3_user_profile(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_web3_sign_in(TEXT) TO anon, authenticated; 