-- =============================================================================
-- OPERATOR: identity merge + legacy singular → plural ETL
-- =============================================================================
-- Target project ONLY: qwoklzpfoblqmnategny (SOS SEATS)
-- Do NOT run against the logistics (or any other) Supabase project.
--
-- BEFORE YOU RUN:
--   1. Take a full database backup / PITR snapshot.
--   2. Paste this file into the Supabase SQL editor for qwoklzpfoblqmnategny
--      (preferred). Live migration history has drifted past the 25 repo files;
--      do NOT blind `supabase db push` of the whole migrations folder.
--
-- WHAT THIS DOES:
--   - Merges two email/wallet identity pairs onto email Auth survivors so
--     email login sees all owned events/guests (dashboard filters by user_id).
--   - Links web3_users via linked_auth_user_id (no auth.users metadata writes).
--   - Migrates legacy singular tables (event/guest/image/seat/wallet) into
--     plural tables with legacy_id_map for audit + idempotency.
--   - Does NOT DROP singular tables.
--
-- Identity pairs (email Auth = survivor):
--   fsumaila79@gmail.com  5cdde926-264e-47b6-a9cf-fe92b3b3cf00
--     = Fj_sumaila         40fb24a8-3ff6-4120-a185-bcf6ed662fb6
--   michaelsosj@gmail.com b924ce8b-f7a0-408c-a92d-108ae9be0614
--     = sosseats001        66c0a293-b150-4847-9c44-a376d27e4de3
--
-- OUT OF SCOPE: app/session changes (wallet login still uses web3 UUID until
-- a later linked_auth_user_id resolve), storage.objects.owner, wallet tx
-- metadata, order_items.current_owner, Data Model FigJam.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Pairs + preflight
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _merge_pairs (
  auth_id uuid PRIMARY KEY,
  web3_id uuid NOT NULL UNIQUE,
  label text NOT NULL
) ON COMMIT DROP;

INSERT INTO _merge_pairs (auth_id, web3_id, label) VALUES
  (
    '5cdde926-264e-47b6-a9cf-fe92b3b3cf00',
    '40fb24a8-3ff6-4120-a185-bcf6ed662fb6',
    'fsumaila79 / Fj_sumaila'
  ),
  (
    'b924ce8b-f7a0-408c-a92d-108ae9be0614',
    '66c0a293-b150-4847-9c44-a376d27e4de3',
    'michaelsosj / sosseats001'
  );

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM _merge_pairs LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = r.auth_id) THEN
      RAISE EXCEPTION 'Preflight failed: auth.users missing % (%)', r.auth_id, r.label;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.web3_users WHERE id = r.web3_id) THEN
      RAISE EXCEPTION 'Preflight failed: web3_users missing % (%)', r.web3_id, r.label;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Identity merge (plural owner columns first)
-- ---------------------------------------------------------------------------
UPDATE public.events e
SET user_id = p.auth_id
FROM _merge_pairs p
WHERE e.user_id = p.web3_id;

UPDATE public.images i
SET user_id = p.auth_id
FROM _merge_pairs p
WHERE i.user_id = p.web3_id;

UPDATE public.notifications n
SET user_id = p.auth_id
FROM _merge_pairs p
WHERE n.user_id = p.web3_id;

UPDATE public.orders o
SET buyer_id = p.auth_id
FROM _merge_pairs p
WHERE o.buyer_id = p.web3_id;

DO $$
BEGIN
  IF to_regclass('public.wallet_multisig_config') IS NOT NULL THEN
    EXECUTE $q$
      UPDATE public.wallet_multisig_config w
      SET primary_user_id = p.auth_id
      FROM _merge_pairs p
      WHERE w.primary_user_id = p.web3_id
    $q$;
  END IF;
END $$;

ALTER TABLE public.web3_users
  ADD COLUMN IF NOT EXISTS linked_auth_user_id uuid;

UPDATE public.web3_users w
SET linked_auth_user_id = p.auth_id
FROM _merge_pairs p
WHERE w.id = p.web3_id;

-- ---------------------------------------------------------------------------
-- 2. Permanent audit / idempotency map
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legacy_id_map (
  entity text NOT NULL,
  legacy_id bigint NOT NULL,
  new_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity, legacy_id)
);

CREATE INDEX IF NOT EXISTS idx_legacy_id_map_new_id
  ON public.legacy_id_map (new_id);

-- ---------------------------------------------------------------------------
-- 3. Legacy image → images
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  leg record;
  new_uuid uuid;
  uid uuid;
BEGIN
  IF to_regclass('public.image') IS NULL THEN
    RAISE NOTICE 'Skipping image ETL: public.image not found';
    RETURN;
  END IF;

  FOR leg IN
    SELECT i.*
    FROM public.image i
    WHERE NOT EXISTS (
      SELECT 1 FROM public.legacy_id_map m
      WHERE m.entity = 'image' AND m.legacy_id = i.id
    )
  LOOP
    BEGIN
      uid := leg."userId"::uuid;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skip legacy image %: userId not uuid', leg.id;
      CONTINUE;
    END;

    -- If this userId was a web3 id in our pairs, store under survivor
    SELECT COALESCE(
      (SELECT p.auth_id FROM _merge_pairs p WHERE p.web3_id = uid),
      uid
    ) INTO uid;

    INSERT INTO public.images (user_id, file_name, file_path, is_public)
    VALUES (
      uid,
      COALESCE(NULLIF(trim(leg."fileName"), ''), 'legacy-image'),
      COALESCE(NULLIF(trim(leg."fileName"), ''), 'legacy-image'),
      true
    )
    RETURNING id INTO new_uuid;

    INSERT INTO public.legacy_id_map (entity, legacy_id, new_id)
    VALUES ('image', leg.id, new_uuid);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Legacy event → events (reuse by survivor owner + lower(trim(name)))
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  leg record;
  new_uuid uuid;
  owner_id uuid;
  mapped_image uuid;
  ev_date date;
  ev_location text;
  ev_audience text;
BEGIN
  IF to_regclass('public.event') IS NULL THEN
    RAISE NOTICE 'Skipping event ETL: public.event not found';
    RETURN;
  END IF;

  FOR leg IN
    SELECT e.*
    FROM public.event e
    WHERE NOT EXISTS (
      SELECT 1 FROM public.legacy_id_map m
      WHERE m.entity = 'event' AND m.legacy_id = e.id
    )
  LOOP
    new_uuid := NULL;
    owner_id := leg.user_id;
    SELECT COALESCE(
      (SELECT p.auth_id FROM _merge_pairs p WHERE p.web3_id = owner_id),
      owner_id
    ) INTO owner_id;

    mapped_image := NULL;
    IF leg."imageId" IS NOT NULL THEN
      SELECT m.new_id INTO mapped_image
      FROM public.legacy_id_map m
      WHERE m.entity = 'image' AND m.legacy_id = leg."imageId";
    END IF;

    -- Reuse existing plural row (e.g. Leadership Festival after identity reassignment)
    SELECT ev.id INTO new_uuid
    FROM public.events ev
    WHERE ev.user_id = owner_id
      AND lower(trim(ev.name)) = lower(trim(leg.name))
    ORDER BY ev.created_at ASC NULLS LAST
    LIMIT 1;

    IF new_uuid IS NULL THEN
      BEGIN
        ev_date := COALESCE(leg.date::date, CURRENT_DATE);
      EXCEPTION WHEN others THEN
        ev_date := CURRENT_DATE;
      END;

      -- Legacy event uses venue (no time/location columns in app writes)
      ev_location := COALESCE(NULLIF(trim(COALESCE(leg.venue, '')), ''), 'TBD');

      ev_audience := lower(trim(COALESCE(leg.audience::text, 'all-ages')));
      IF ev_audience NOT IN (
        'all-ages', '18-plus', '21-plus', 'family', 'corporate', 'students'
      ) THEN
        ev_audience := 'all-ages';
      END IF;

      INSERT INTO public.events (
        user_id,
        name,
        description,
        date,
        time,
        location,
        audience_type,
        event_visibility,
        status,
        image_id
      )
      VALUES (
        owner_id,
        COALESCE(NULLIF(trim(leg.name), ''), 'Untitled legacy event'),
        NULL,
        ev_date,
        TIME '00:00:00',
        ev_location,
        ev_audience,
        'public',
        'draft',
        mapped_image
      )
      RETURNING id INTO new_uuid;
    ELSIF mapped_image IS NOT NULL THEN
      UPDATE public.events
      SET image_id = COALESCE(image_id, mapped_image)
      WHERE id = new_uuid;
    END IF;

    INSERT INTO public.legacy_id_map (entity, legacy_id, new_id)
    VALUES ('event', leg.id, new_uuid);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Legacy seat → ticket_types
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  leg record;
  event_uuid uuid;
  type_uuid uuid;
  type_name text;
BEGIN
  IF to_regclass('public.seat') IS NULL THEN
    RAISE NOTICE 'Skipping seat ETL: public.seat not found';
    RETURN;
  END IF;

  FOR leg IN
    SELECT s.*
    FROM public.seat s
    WHERE NOT EXISTS (
      SELECT 1 FROM public.legacy_id_map m
      WHERE m.entity = 'seat' AND m.legacy_id = s.id
    )
  LOOP
    event_uuid := NULL;
    type_uuid := NULL;

    SELECT m.new_id INTO event_uuid
    FROM public.legacy_id_map m
    WHERE m.entity = 'event' AND m.legacy_id = leg.eventid;

    IF event_uuid IS NULL THEN
      RAISE NOTICE 'Skip legacy seat %: event % not mapped', leg.id, leg.eventid;
      CONTINUE;
    END IF;

    type_name := COALESCE(NULLIF(trim(leg."Area"), ''), 'General');

    SELECT tt.id INTO type_uuid
    FROM public.ticket_types tt
    WHERE tt.event_id = event_uuid
      AND lower(trim(tt.name)) = lower(trim(type_name))
    LIMIT 1;

    IF type_uuid IS NOT NULL THEN
      INSERT INTO public.legacy_id_map (entity, legacy_id, new_id)
      VALUES ('seat', leg.id, type_uuid)
      ON CONFLICT DO NOTHING;
      CONTINUE;
    END IF;

    INSERT INTO public.ticket_types (event_id, name, price, quantity, is_active)
    VALUES (
      event_uuid,
      type_name,
      COALESCE(leg."ticketPrice", 0),
      COALESCE(leg."maxSeat", 0),
      true
    )
    RETURNING id INTO type_uuid;

    INSERT INTO public.legacy_id_map (entity, legacy_id, new_id)
    VALUES ('seat', leg.id, type_uuid);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 6. Legacy guest → guests
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  leg record;
  event_uuid uuid;
  new_uuid uuid;
  raw_name text;
  first_tok text;
  last_tok text;
  space_pos int;
  ticket text;
  new_status text;
  cin timestamptz;
BEGIN
  IF to_regclass('public.guest') IS NULL THEN
    RAISE NOTICE 'Skipping guest ETL: public.guest not found';
    RETURN;
  END IF;

  FOR leg IN
    SELECT g.*
    FROM public.guest g
    WHERE NOT EXISTS (
      SELECT 1 FROM public.legacy_id_map m
      WHERE m.entity = 'guest' AND m.legacy_id = g.id
    )
  LOOP
    event_uuid := NULL;
    new_uuid := NULL;

    SELECT m.new_id INTO event_uuid
    FROM public.legacy_id_map m
    WHERE m.entity = 'event' AND m.legacy_id = leg."event_Id";

    IF event_uuid IS NULL THEN
      RAISE NOTICE 'Skip legacy guest %: event % not mapped', leg.id, leg."event_Id";
      CONTINUE;
    END IF;

    ticket := NULLIF(trim(leg."inviteCode"), '');
    IF ticket IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.guests g2 WHERE g2.ticket_number = ticket
    ) THEN
      -- Global UNIQUE on ticket_number: treat as already migrated / duplicate
      SELECT g2.id INTO new_uuid
      FROM public.guests g2
      WHERE g2.ticket_number = ticket
      LIMIT 1;

      INSERT INTO public.legacy_id_map (entity, legacy_id, new_id)
      VALUES ('guest', leg.id, new_uuid)
      ON CONFLICT DO NOTHING;
      CONTINUE;
    END IF;

    raw_name := COALESCE(NULLIF(trim(leg."guestName"), ''), 'Guest');
    space_pos := position(' ' IN raw_name);
    IF space_pos > 0 THEN
      first_tok := left(raw_name, space_pos - 1);
      last_tok := substr(raw_name, space_pos + 1);
    ELSE
      first_tok := raw_name;
      last_tok := '';
    END IF;

    IF COALESCE(leg.verified, false) IS TRUE THEN
      new_status := 'checked-in';
      cin := COALESCE(leg."verifiedTime", now());
    ELSE
      new_status := 'pending';
      cin := NULL;
    END IF;

    INSERT INTO public.guests (
      event_id,
      first_name,
      last_name,
      ticket_number,
      status,
      check_in_time
    )
    VALUES (
      event_uuid,
      first_tok,
      last_tok,
      ticket,
      new_status,
      cin
    )
    RETURNING id INTO new_uuid;

    INSERT INTO public.legacy_id_map (entity, legacy_id, new_id)
    VALUES ('guest', leg.id, new_uuid);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 7. Legacy wallet → ensure web3_users.wallet_address for survivors
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  leg record;
  addr text;
  web3 uuid;
BEGIN
  IF to_regclass('public.wallet') IS NULL THEN
    RAISE NOTICE 'Skipping wallet ETL: public.wallet not found';
    RETURN;
  END IF;

  FOR leg IN
    SELECT w.*
    FROM public.wallet w
    WHERE w.user_id IN (SELECT auth_id FROM _merge_pairs)
  LOOP
    -- Legacy wallet columns may be json/text; cast before trim
    addr := COALESCE(
      NULLIF(trim(leg.wallet::text), ''),
      NULLIF(trim(leg."publicKey"::text), '')
    );
    -- Strip JSON string quotes if value was stored as a JSON string
    IF addr LIKE '"%"' THEN
      addr := trim(both '"' from addr);
    END IF;
    IF addr IS NULL THEN
      CONTINUE;
    END IF;

    SELECT p.web3_id INTO web3
    FROM _merge_pairs p
    WHERE p.auth_id = leg.user_id;

    UPDATE public.web3_users wu
    SET
      wallet_address = CASE
        WHEN wu.wallet_address IS NULL OR trim(wu.wallet_address) = '' THEN addr
        ELSE wu.wallet_address
      END,
      linked_auth_user_id = COALESCE(wu.linked_auth_user_id, leg.user_id)
    WHERE wu.id = web3;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 8. VERIFY notices (operator checklist)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
  guest_count bigint;
  orphan_count bigint;
  link_ok boolean;
BEGIN
  FOR r IN SELECT * FROM _merge_pairs LOOP
    SELECT count(*) INTO guest_count
    FROM public.guests g
    JOIN public.events e ON e.id = g.event_id
    WHERE e.user_id = r.auth_id;

    SELECT (linked_auth_user_id = r.auth_id) INTO link_ok
    FROM public.web3_users
    WHERE id = r.web3_id;

    RAISE NOTICE 'VERIFY %: guests_via_events=% link_ok=%',
      r.label, guest_count, link_ok;
  END LOOP;

  SELECT count(*) INTO orphan_count
  FROM public.guests g
  LEFT JOIN public.events e ON e.id = g.event_id
  WHERE e.id IS NULL;

  RAISE NOTICE 'VERIFY orphan_guests=%', orphan_count;

  RAISE NOTICE 'VERIFY legacy_id_map counts: event=% image=% guest=% seat=%',
    (SELECT count(*) FROM public.legacy_id_map WHERE entity = 'event'),
    (SELECT count(*) FROM public.legacy_id_map WHERE entity = 'image'),
    (SELECT count(*) FROM public.legacy_id_map WHERE entity = 'guest'),
    (SELECT count(*) FROM public.legacy_id_map WHERE entity = 'seat');
END $$;

COMMIT;
