-- Roadmap 2.7: auth-only web3_users rows for email/phone username identity.
-- Username remains UNIQUE (global). Wallet path unchanged.

ALTER TABLE public.web3_users
  ALTER COLUMN wallet_address DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_web3_users_linked_auth_user_id
  ON public.web3_users (linked_auth_user_id)
  WHERE linked_auth_user_id IS NOT NULL;
