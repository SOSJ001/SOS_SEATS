# Shadow RLS rollout: storage and `images`

This document describes how to tighten Row Level Security for **`storage.objects`** (bucket `event_images`) and **`public.images`** without breaking flows that still rely on the **anon key** and **custom session cookies** (where `auth.uid()` from Supabase Auth may not match app identity).

## Current state (from migrations)

| Surface           | Policy name (approx.)              | Effect                                                                          |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| `storage.objects` | `Allow all event image operations` | `FOR ALL` where `bucket_id = 'event_images'` — very permissive for that bucket. |
| `public.images`   | `Allow all image operations`       | `FOR ALL USING (true)` — full access when RLS applies.                          |

Earlier migrations (`20250723000001_storage_bucket.sql`, `20250723000004_fix_existing_objects.sql`) used owner-scoped policies; `20250723000007_comprehensive_rls_fix.sql` replaced them with the permissive policies above to unblock server-side and anon-driven uploads.

**Risk of tightening in one step:** If new policies require `auth.uid()` or `authenticated` JWT while the browser or server client still uses **anon** without a matching Supabase session, **SELECT / INSERT / UPDATE / DELETE** on storage or `images` can fail silently or with RLS errors.

## Shadow policy strategy

Goal: introduce **stricter policies under new names** and verify behavior **before** removing permissive policies.

1. **Inventory**  
   In SQL or Supabase Studio, list policies on `storage.objects` and `public.images` (`pg_policies`). Confirm commands (`SELECT`, `INSERT`, etc.) and roles (`anon`, `authenticated`, `service_role`).

2. **Add v2 policies (do not drop old ones yet)**
   - Use **distinct policy names**, e.g. `event_images_select_public_v2`, `images_select_public_or_owner_v2`.
   - Postgres allows multiple permissive policies for the same command if **any** passes; therefore **adding** a restrictive policy alone does **not** tighten behavior while a `USING (true)` policy remains.
   - Practical sequence:
     - **Phase A — Document-only / staging:** Add v2 policies on a **branch** or local DB only; run integration tests (event create, image upload, public read URLs).
     - **Phase B — Replace permissive row:** In a **follow-up migration**, `DROP POLICY` the permissive policy **only after** all write/read paths are verified under the stricter rules (see verification gate below).
   - If you need interim tightening without full `auth.uid()` alignment, consider **service role** for trusted server-only uploads (see long-term note) plus narrow public `SELECT` on storage paths you expose.

3. **Two-step migration pattern (recommended)**
   - Migration 1: `CREATE POLICY ...` v2 for the target role/expression (e.g. public read of `event_images`, or `INSERT` for `service_role` only if you switch uploads to service client).
   - Migration 2 (after gate): `DROP POLICY "Allow all event image operations"` / `DROP POLICY "Allow all image operations"` (exact names from `pg_policies`).

## Verification gate (required before dropping permissive policies)

Confirm **which client** performs each operation:

| Flow                | Typical client                                             | Files to verify                                                                                 |
| ------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Event image upload  | Browser `supabase` and/or `locals.supabase` from `+server` | `src/lib/services/eventCrud.js` (`uploadEventImageNew`), `src/routes/createEventApi/+server.js` |
| Image metadata rows | Same as upload path                                        | Any insert/update into `public.images`                                                          |

Checklist:

- [ ] Upload succeeds with the **same** role the app uses in production (anon vs authenticated).
- [ ] Public or signed URLs still **load** for attendees if events are gallery-style public.
- [ ] Server routes using `locals.supabase` from `hooks.server.js` still see refreshed cookies where needed.
- [ ] No reliance on “open” `images` policy for unrelated tables (scope changes only `storage.objects` / `images`).

Optional hardening (separate milestone): use **service role** only inside trusted `+server` routes for uploads, keep RLS for reads; reduces dependence on anon + broad storage policies.

## Rollback

If a new migration breaks uploads or reads:

1. Re-deploy the previous migration set, **or** run explicit `DROP POLICY ... ON storage.objects` / `ON images` for the new v2 names and (if removed) **re-create** the previous permissive policy from `20250723000007_comprehensive_rls_fix.sql`.
2. Confirm `pg_policies` matches the intended “last known good” set.
3. Document the incident (which policy + which client path failed) before retrying a narrower v2.

## Policy name reference (current permissive)

Use these exact names when scripting `DROP POLICY`:

- `storage.objects`: `"Allow all event image operations"`
- `public.images`: `"Allow all image operations"`

Always verify in your database before dropping; names must match `pg_policies.policyname` exactly (including quotes/casing).

## Milestone 4 additive policies (orders / order_items)

Migration [`20260423120000_milestone4_rls_and_collection.sql`](supabase/migrations/20260423120000_milestone4_rls_and_collection.sql) adds **read** policies so event owners can `SELECT` rows for their events without removing buyer-scoped policies:

| Table                | Policy name                             | Command  | Intent                                                              |
| -------------------- | --------------------------------------- | -------- | ------------------------------------------------------------------- |
| `public.orders`      | `orders_select_event_organizer_v2`      | `SELECT` | `event_id` belongs to an `events` row where `user_id = auth.uid()`. |
| `public.order_items` | `order_items_select_event_organizer_v2` | `SELECT` | Parent `orders` row is for an event owned by `auth.uid()`.          |

**Rollback:** `DROP POLICY IF EXISTS "orders_select_event_organizer_v2" ON public.orders;` and the same for `order_items_select_event_organizer_v2` on `public.order_items`.

**Note:** `wallet_transactions` was not present in repo migrations; manage equivalent policies in Supabase Studio if your production schema includes that table.
