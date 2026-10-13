-- Pre-launch security lockdown.
-- The browser no longer calls database functions; every .rpc() runs on the server
-- with the service role. Trigger functions keep working because Postgres checks
-- EXECUTE only when a trigger is created, not when it fires.

-- 1. Database functions are server-only.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO service_role;

-- 2. Fixed search_path on every public function that does not set one.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'
        )
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn.sig);
  END LOOP;
END;
$$;

-- 3. Race guards for money rows.
-- One pending withdrawal per ledger key, so a double click cannot pay out twice.
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_withdrawal_per_wallet
  ON public.wallet_transactions (wallet_address)
  WHERE type = 'withdrawal' AND status = 'pending';

-- Each private-issue payment code can be redeemed once.
CREATE UNIQUE INDEX IF NOT EXISTS one_use_per_private_issue_payment
  ON public.wallet_transactions (external_id)
  WHERE type = 'private_issue_payment';

-- 4. Multisig and wallet notifications are switched off. These policies let
-- signed-out visitors (auth.uid() IS NULL) read or change rows, so only the
-- service role keeps access.
DROP POLICY IF EXISTS "Simple: View records where signer exists in web3_users"
  ON public.wallet_multisig_signers;
DROP POLICY IF EXISTS "Users can manage signers for their primary wallet"
  ON public.wallet_multisig_signers;
DROP POLICY IF EXISTS "Users can view signers for their primary wallet or where they a"
  ON public.wallet_multisig_signers;
DROP POLICY IF EXISTS "Users can view signers where their wallet is a signer"
  ON public.wallet_multisig_signers;

DROP POLICY IF EXISTS "Users can manage their multisig config"
  ON public.wallet_multisig_config;
DROP POLICY IF EXISTS "Users can view their multisig config"
  ON public.wallet_multisig_config;

DROP POLICY IF EXISTS "Users can insert notifications for their wallet"
  ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications"
  ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications"
  ON public.notifications;
