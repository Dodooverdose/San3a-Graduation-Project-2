-- ============================================================
-- Migration 002: Fix Admin RLS Policies (v2 — inline JWT checks)
-- ============================================================
-- PROBLEM:
--   1. Old policies used "SELECT id FROM auth.users" subqueries.
--      The authenticated role CANNOT query auth.users → 0 rows → RLS blocks all.
--   2. Helper-function approach can cause HTTP 400 if PostgREST schema
--      cache hasn't reloaded or SECURITY DEFINER interferes.
--
-- FIX:
--   Use INLINE JWT claim checks. No helper function needed.
--   The JWT already contains user_metadata from raw_user_meta_data.
--   Access it:  auth.jwt()->'user_metadata'->>'role' = 'admin'
--
-- WHY 406? PostgREST returns 406 when .single() gets 0 rows.
-- WHY 400? RLS policy error (function not found / permissions).
-- ============================================================


-- ============================================================
-- STEP 0: Drop the helper function if it was created before
-- ============================================================
DROP FUNCTION IF EXISTS public.is_admin();


-- ============================================================
-- STEP 1: public.admin — enable RLS + drop old + create new
-- ============================================================
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='admin'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "admin_select" ON public.admin FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "admin_insert" ON public.admin FOR INSERT
  WITH CHECK ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "admin_update" ON public.admin FOR UPDATE
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' )
  WITH CHECK ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "admin_delete" ON public.admin FOR DELETE
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin TO authenticated;


-- ============================================================
-- STEP 2: public.users
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='users'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "users_admin_select" ON public.users FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "users_admin_insert" ON public.users FOR INSERT
  WITH CHECK ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "users_admin_update" ON public.users FOR UPDATE
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' )
  WITH CHECK ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "users_admin_delete" ON public.users FOR DELETE
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;


-- ============================================================
-- STEP 3: public.technician
-- ============================================================
ALTER TABLE public.technician ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='technician'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.technician', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "technician_admin_select" ON public.technician FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "technician_admin_insert" ON public.technician FOR INSERT
  WITH CHECK ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "technician_admin_update" ON public.technician FOR UPDATE
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' )
  WITH CHECK ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "technician_admin_delete" ON public.technician FOR DELETE
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician TO authenticated;


-- ============================================================
-- STEP 4: public.request
-- ============================================================
ALTER TABLE public.request ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='request'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.request', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "request_admin_select" ON public.request FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "request_admin_insert" ON public.request FOR INSERT
  WITH CHECK ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "request_admin_update" ON public.request FOR UPDATE
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' )
  WITH CHECK ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "request_admin_delete" ON public.request FOR DELETE
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.request TO authenticated;


-- ============================================================
-- STEP 5: public.complaint
-- ============================================================
ALTER TABLE public.complaint ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='complaint'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.complaint', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "complaint_admin_select" ON public.complaint FOR SELECT
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "complaint_admin_insert" ON public.complaint FOR INSERT
  WITH CHECK ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "complaint_admin_update" ON public.complaint FOR UPDATE
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' )
  WITH CHECK ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

CREATE POLICY "complaint_admin_delete" ON public.complaint FOR DELETE
  USING ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaint TO authenticated;


-- ============================================================
-- STEP 6: Also fix admin_users table if it exists (from migration 001)
-- ============================================================
DO $$ 
DECLARE pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admin_users') THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='admin_users'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol.policyname);
    END LOOP;
    EXECUTE 'CREATE POLICY "admin_users_select" ON public.admin_users FOR SELECT USING ((auth.jwt()->''user_metadata''->>''role'') = ''admin'')';
    EXECUTE 'CREATE POLICY "admin_users_update" ON public.admin_users FOR UPDATE USING ((auth.jwt()->''user_metadata''->>''role'') = ''admin'') WITH CHECK ((auth.jwt()->''user_metadata''->>''role'') = ''admin'')';
    EXECUTE 'CREATE POLICY "admin_users_insert" ON public.admin_users FOR INSERT WITH CHECK ((auth.jwt()->''user_metadata''->>''role'') = ''admin'')';
  END IF;
END $$;


-- ============================================================
-- STEP 7: Force PostgREST to reload its schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';


-- ============================================================
-- STEP 8: Diagnostic queries — run these AFTER the migration
-- ============================================================

-- 8a. Verify policies are in place:
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('admin','users','technician','request','complaint')
-- ORDER BY tablename, policyname;

-- 8b. Verify your JWT contains the role (run as authenticated user):
-- SELECT auth.jwt()->'user_metadata'->>'role' AS jwt_role;

-- 8c. If 8b returns NULL, your metadata isn't in the JWT.
-- Fix by updating the user's metadata and re-signing in:
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}', '"admin"'::jsonb
-- )
-- WHERE id = '8c120062-344e-41bb-84dc-00812df7c056';
-- Then sign out and sign back in to get a fresh JWT.

-- DONE!
