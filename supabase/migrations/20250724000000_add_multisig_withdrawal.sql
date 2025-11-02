-- SOS SEATS Multi-Signature Withdrawal Migration
-- Adds support for multi-signature withdrawals requiring multiple wallet signatures
-- Run this SQL in your Supabase SQL Editor

-- =====================================================
-- 1. WALLET MULTISIG SIGNERS TABLE
-- Stores authorized signer wallets for each primary wallet
-- =====================================================
CREATE TABLE IF NOT EXISTS wallet_multisig_signers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_wallet_address TEXT NOT NULL, -- Wallet that receives revenue (does withdrawals)
    signer_wallet_address TEXT NOT NULL, -- Wallet that can sign withdrawals
    wallet_label TEXT, -- e.g., "Backup Wallet", "Business Partner"
    is_active BOOLEAN DEFAULT true,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(primary_wallet_address, signer_wallet_address)
);

-- =====================================================
-- 2. WALLET MULTISIG CONFIG TABLE
-- Stores multisig configuration per primary wallet
-- =====================================================
CREATE TABLE IF NOT EXISTS wallet_multisig_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_wallet_address TEXT NOT NULL UNIQUE, -- Wallet that receives revenue
    primary_user_id UUID NOT NULL, -- User ID from auth.users or web3_users
    required_signatures INTEGER NOT NULL DEFAULT 2, -- e.g., 2 of 3 signatures required
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_threshold CHECK (required_signatures > 0 AND required_signatures <= 10)
);

-- =====================================================
-- 3. ENHANCE WALLET_TRANSACTIONS TABLE
-- Add columns for multisig support
-- =====================================================
ALTER TABLE wallet_transactions 
    ADD COLUMN IF NOT EXISTS multisig_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS required_signatures INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS collected_signatures JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS pending_token TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 4. UPDATE STATUS CONSTRAINT
-- Add pending_approval status for pending multisig withdrawals
-- =====================================================
-- Drop existing constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'wallet_transactions_status_check'
    ) THEN
        ALTER TABLE wallet_transactions 
        DROP CONSTRAINT wallet_transactions_status_check;
    END IF;
END $$;

-- Add new constraint with pending_approval status
ALTER TABLE wallet_transactions
    ADD CONSTRAINT wallet_transactions_status_check 
    CHECK (status = ANY (ARRAY['pending', 'pending_approval', 'completed', 'failed', 'cancelled']));

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_wallet_multisig_signers_primary ON wallet_multisig_signers(primary_wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_multisig_signers_signer ON wallet_multisig_signers(signer_wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_multisig_signers_active ON wallet_multisig_signers(is_active);
CREATE INDEX IF NOT EXISTS idx_wallet_multisig_config_primary ON wallet_multisig_config(primary_wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_multisig_config_user ON wallet_multisig_config(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_multisig_config_enabled ON wallet_multisig_config(is_enabled);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_pending_token ON wallet_transactions(pending_token);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_multisig ON wallet_transactions(multisig_enabled);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_expires ON wallet_transactions(expires_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE wallet_multisig_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_multisig_config ENABLE ROW LEVEL SECURITY;

-- wallet_multisig_signers policies
CREATE POLICY "Users can view signers for their primary wallet" ON wallet_multisig_signers
    FOR SELECT USING (
        primary_wallet_address = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM wallet_multisig_config wmc
            WHERE wmc.primary_wallet_address = wallet_multisig_signers.primary_wallet_address
            AND (wmc.primary_user_id = auth.uid() OR wmc.primary_wallet_address = auth.uid()::text)
        )
    );

CREATE POLICY "Users can manage signers for their primary wallet" ON wallet_multisig_signers
    FOR ALL USING (
        primary_wallet_address = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM wallet_multisig_config wmc
            WHERE wmc.primary_wallet_address = wallet_multisig_signers.primary_wallet_address
            AND (wmc.primary_user_id = auth.uid() OR wmc.primary_wallet_address = auth.uid()::text)
        )
    );

-- wallet_multisig_config policies
CREATE POLICY "Users can view their multisig config" ON wallet_multisig_config
    FOR SELECT USING (
        primary_user_id = auth.uid() OR
        primary_wallet_address = auth.uid()::text
    );

CREATE POLICY "Users can manage their multisig config" ON wallet_multisig_config
    FOR ALL USING (
        primary_user_id = auth.uid() OR
        primary_wallet_address = auth.uid()::text
    );

-- =====================================================
-- 7. FUNCTIONS FOR MULTISIG MANAGEMENT
-- =====================================================

-- Function to get multisig config with signers
CREATE OR REPLACE FUNCTION get_multisig_config(p_wallet_address TEXT)
RETURNS TABLE(
    config_id UUID,
    primary_wallet_address TEXT,
    primary_user_id UUID,
    required_signatures INTEGER,
    is_enabled BOOLEAN,
    total_signers INTEGER,
    signers JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wmc.id as config_id,
        wmc.primary_wallet_address,
        wmc.primary_user_id,
        wmc.required_signatures,
        wmc.is_enabled,
        COUNT(wms.id)::INTEGER as total_signers,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', wms.id,
                    'signer_wallet_address', wms.signer_wallet_address,
                    'wallet_label', wms.wallet_label,
                    'is_active', wms.is_active,
                    'added_at', wms.added_at
                ) ORDER BY wms.added_at
            ) FILTER (WHERE wms.id IS NOT NULL),
            '[]'::jsonb
        ) as signers
    FROM wallet_multisig_config wmc
    LEFT JOIN wallet_multisig_signers wms 
        ON wms.primary_wallet_address = wmc.primary_wallet_address 
        AND wms.is_active = true
    WHERE wmc.primary_wallet_address = p_wallet_address
    GROUP BY wmc.id, wmc.primary_wallet_address, wmc.primary_user_id, 
             wmc.required_signatures, wmc.is_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update multisig config
CREATE OR REPLACE FUNCTION upsert_multisig_config(
    p_primary_wallet_address TEXT,
    p_primary_user_id UUID,
    p_required_signatures INTEGER,
    p_is_enabled BOOLEAN
)
RETURNS TABLE(
    success BOOLEAN,
    config_id UUID,
    message TEXT
) AS $$
DECLARE
    v_config_id UUID;
    v_total_signers INTEGER;
BEGIN
    -- Get current signer count
    SELECT COUNT(*)::INTEGER INTO v_total_signers
    FROM wallet_multisig_signers
    WHERE primary_wallet_address = p_primary_wallet_address
    AND is_active = true;
    
    -- Validate required signatures doesn't exceed available signers
    IF p_is_enabled AND p_required_signatures > v_total_signers + 1 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 
            format('Required signatures (%s) exceeds available signers (%s). Add more signers first.', 
                   p_required_signatures, v_total_signers + 1)::TEXT;
        RETURN;
    END IF;
    
    -- Upsert config
    INSERT INTO wallet_multisig_config (
        primary_wallet_address,
        primary_user_id,
        required_signatures,
        is_enabled
    ) VALUES (
        p_primary_wallet_address,
        p_primary_user_id,
        p_required_signatures,
        p_is_enabled
    )
    ON CONFLICT (primary_wallet_address) 
    DO UPDATE SET
        primary_user_id = EXCLUDED.primary_user_id,
        required_signatures = EXCLUDED.required_signatures,
        is_enabled = EXCLUDED.is_enabled,
        updated_at = NOW()
    RETURNING id INTO v_config_id;
    
    RETURN QUERY SELECT TRUE, v_config_id, 'Multisig config updated successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add signer wallet
CREATE OR REPLACE FUNCTION add_multisig_signer(
    p_primary_wallet_address TEXT,
    p_signer_wallet_address TEXT,
    p_wallet_label TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    signer_id UUID,
    message TEXT
) AS $$
DECLARE
    v_signer_id UUID;
BEGIN
    -- Prevent adding primary wallet as signer (it's automatically included)
    IF p_primary_wallet_address = p_signer_wallet_address THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 
            'Primary wallet is automatically included as a signer'::TEXT;
        RETURN;
    END IF;
    
    -- Check if signer already exists
    IF EXISTS (
        SELECT 1 FROM wallet_multisig_signers
        WHERE primary_wallet_address = p_primary_wallet_address
        AND signer_wallet_address = p_signer_wallet_address
    ) THEN
        -- Reactivate if exists but inactive
        UPDATE wallet_multisig_signers
        SET is_active = true,
            wallet_label = COALESCE(p_wallet_label, wallet_label)
        WHERE primary_wallet_address = p_primary_wallet_address
        AND signer_wallet_address = p_signer_wallet_address
        RETURNING id INTO v_signer_id;
        
        RETURN QUERY SELECT TRUE, v_signer_id, 'Signer reactivated successfully'::TEXT;
        RETURN;
    END IF;
    
    -- Add new signer
    INSERT INTO wallet_multisig_signers (
        primary_wallet_address,
        signer_wallet_address,
        wallet_label
    ) VALUES (
        p_primary_wallet_address,
        p_signer_wallet_address,
        p_wallet_label
    )
    RETURNING id INTO v_signer_id;
    
    RETURN QUERY SELECT TRUE, v_signer_id, 'Signer added successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove signer wallet
CREATE OR REPLACE FUNCTION remove_multisig_signer(
    p_primary_wallet_address TEXT,
    p_signer_wallet_address TEXT
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_config wallet_multisig_config%ROWTYPE;
    v_active_signers INTEGER;
BEGIN
    -- Check if config exists and is enabled
    SELECT * INTO v_config
    FROM wallet_multisig_config
    WHERE primary_wallet_address = p_primary_wallet_address
    AND is_enabled = true;
    
    -- Deactivate signer
    UPDATE wallet_multisig_signers
    SET is_active = false
    WHERE primary_wallet_address = p_primary_wallet_address
    AND signer_wallet_address = p_signer_wallet_address;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Signer not found'::TEXT;
        RETURN;
    END IF;
    
    -- If config exists, check if we need to disable it
    IF FOUND THEN
        -- Count remaining active signers (including primary)
        SELECT COUNT(*)::INTEGER + 1 INTO v_active_signers
        FROM wallet_multisig_signers
        WHERE primary_wallet_address = p_primary_wallet_address
        AND is_active = true;
        
        -- Disable config if required signatures exceeds available signers
        IF v_config.required_signatures > v_active_signers THEN
            UPDATE wallet_multisig_config
            SET is_enabled = false
            WHERE primary_wallet_address = p_primary_wallet_address;
            
            RETURN QUERY SELECT TRUE, 
                format('Signer removed. Multisig disabled because required signatures (%s) exceeds available signers (%s).', 
                       v_config.required_signatures, v_active_signers)::TEXT;
            RETURN;
        END IF;
    END IF;
    
    RETURN QUERY SELECT TRUE, 'Signer removed successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add signature to pending withdrawal
CREATE OR REPLACE FUNCTION add_withdrawal_signature(
    p_withdrawal_id UUID,
    p_wallet_address TEXT,
    p_signature TEXT,
    p_public_key TEXT
)
RETURNS TABLE(
    success BOOLEAN,
    threshold_met BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_withdrawal wallet_transactions%ROWTYPE;
    v_new_signatures JSONB;
    v_signature_count INTEGER;
    v_config wallet_multisig_config%ROWTYPE;
BEGIN
    -- Get withdrawal
    SELECT * INTO v_withdrawal
    FROM wallet_transactions
    WHERE id = p_withdrawal_id
    AND status = 'pending_approval'
    AND multisig_enabled = true;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, FALSE, 'Pending withdrawal not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if expired
    IF v_withdrawal.expires_at < NOW() THEN
        UPDATE wallet_transactions
        SET status = 'cancelled'
        WHERE id = p_withdrawal_id;
        RETURN QUERY SELECT FALSE, FALSE, 'Withdrawal expired'::TEXT;
        RETURN;
    END IF;
    
    -- Verify wallet is authorized
    SELECT * INTO v_config
    FROM wallet_multisig_config
    WHERE primary_wallet_address = v_withdrawal.wallet_address
    AND is_enabled = true;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, FALSE, 'Multisig config not found or disabled'::TEXT;
        RETURN;
    END IF;
    
    -- Check if wallet is primary or authorized signer
    IF p_wallet_address != v_withdrawal.wallet_address 
       AND NOT EXISTS (
           SELECT 1 FROM wallet_multisig_signers
           WHERE primary_wallet_address = v_withdrawal.wallet_address
           AND signer_wallet_address = p_wallet_address
           AND is_active = true
       ) THEN
        RETURN QUERY SELECT FALSE, FALSE, 'Wallet not authorized to sign this withdrawal'::TEXT;
        RETURN;
    END IF;
    
    -- Check if already signed
    IF EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_withdrawal.collected_signatures) sig
        WHERE sig->>'wallet' = p_wallet_address
    ) THEN
        RETURN QUERY SELECT FALSE, FALSE, 'Wallet already signed this withdrawal'::TEXT;
        RETURN;
    END IF;
    
    -- Add signature
    v_new_signatures := v_withdrawal.collected_signatures || jsonb_build_object(
        'wallet', p_wallet_address,
        'signature', p_signature,
        'public_key', p_public_key,
        'signed_at', NOW()::TEXT
    );
    
    -- Count signatures
    v_signature_count := jsonb_array_length(v_new_signatures);
    
    -- Update withdrawal
    UPDATE wallet_transactions
    SET collected_signatures = v_new_signatures,
        updated_at = NOW()
    WHERE id = p_withdrawal_id;
    
    -- Check if threshold met
    IF v_signature_count >= v_withdrawal.required_signatures THEN
        RETURN QUERY SELECT TRUE, TRUE, 
            format('Signature added. Threshold met (%s/%s). Withdrawal ready to execute.', 
                   v_signature_count, v_withdrawal.required_signatures)::TEXT;
    ELSE
        RETURN QUERY SELECT TRUE, FALSE, 
            format('Signature added. Waiting for %s more signature(s) (%s/%s).', 
                   v_withdrawal.required_signatures - v_signature_count, 
                   v_signature_count, v_withdrawal.required_signatures)::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON wallet_multisig_signers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wallet_multisig_config TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_multisig_config(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_multisig_config(TEXT, UUID, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION add_multisig_signer(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_multisig_signer(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_withdrawal_signature(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Grant permissions to anonymous users (for pending withdrawal access via token)
GRANT SELECT ON wallet_transactions TO anon;

-- =====================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE wallet_multisig_signers IS 'Authorized signer wallets for multi-signature withdrawals';
COMMENT ON TABLE wallet_multisig_config IS 'Multi-signature configuration per primary wallet';
COMMENT ON COLUMN wallet_transactions.multisig_enabled IS 'Whether this withdrawal requires multiple signatures';
COMMENT ON COLUMN wallet_transactions.required_signatures IS 'Number of signatures required to execute withdrawal';
COMMENT ON COLUMN wallet_transactions.collected_signatures IS 'Array of collected signatures: [{wallet, signature, public_key, signed_at}]';
COMMENT ON COLUMN wallet_transactions.pending_token IS 'Unique token for accessing pending withdrawal without auth';
COMMENT ON COLUMN wallet_transactions.expires_at IS 'Expiration time for pending withdrawal (default 24h)';

COMMENT ON FUNCTION get_multisig_config IS 'Get multisig configuration with list of authorized signers';
COMMENT ON FUNCTION upsert_multisig_config IS 'Create or update multisig configuration for a wallet';
COMMENT ON FUNCTION add_multisig_signer IS 'Add an authorized signer wallet to multisig config';
COMMENT ON FUNCTION remove_multisig_signer IS 'Remove an authorized signer wallet from multisig config';
COMMENT ON FUNCTION add_withdrawal_signature IS 'Add a signature to a pending withdrawal and check if threshold is met';

