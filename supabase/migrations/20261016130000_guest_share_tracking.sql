-- Track when a private ticket was downloaded or shared from the organiser guests tab.
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS shared_at timestamptz,
  ADD COLUMN IF NOT EXISTS shared_via text
    CHECK (shared_via IS NULL OR shared_via IN ('download', 'share')),
  ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0;
