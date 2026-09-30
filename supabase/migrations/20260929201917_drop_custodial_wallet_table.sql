-- Destroy legacy custodial Solana keypairs (plain-text secretKey in wallet json).
-- public.wallet is not created by any migration; guard keeps fresh replays safe.
DO $$
DECLARE ids bigint[];
BEGIN
  IF to_regclass('public.wallet') IS NULL THEN
    RETURN;
  END IF;
  EXECUTE 'SELECT array_agg(id ORDER BY id) FROM public.wallet' INTO ids;
  IF ids IS DISTINCT FROM ARRAY[47, 49]::bigint[] THEN
    RAISE EXCEPTION 'public.wallet has unexpected rows: %', ids;
  END IF;
END $$;

DROP TABLE IF EXISTS public.wallet;
