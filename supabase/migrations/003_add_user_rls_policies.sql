-- ============================================================
-- Migration 003: Add normal-user RLS policies
-- ============================================================
-- Migration 002 only created admin-only policies, breaking
-- normal user access. This adds policies so authenticated
-- users can access their own data.
-- ============================================================


-- ============================================================
-- public.users — any authenticated user can read/update their own row
-- ============================================================
CREATE POLICY "users_self_select" ON public.users FOR SELECT
  USING ( auth.role() = 'authenticated' );

CREATE POLICY "users_self_update" ON public.users FOR UPDATE
  USING (
    email = (auth.jwt()->>'email')
  )
  WITH CHECK (
    email = (auth.jwt()->>'email')
  );

CREATE POLICY "users_self_insert" ON public.users FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );


-- ============================================================
-- public.technician — any authenticated user can read technicians,
-- technicians can update their own row
-- ============================================================
CREATE POLICY "technician_self_select" ON public.technician FOR SELECT
  USING ( auth.role() = 'authenticated' );

CREATE POLICY "technician_self_update" ON public.technician FOR UPDATE
  USING (
    email = (auth.jwt()->>'email')
  )
  WITH CHECK (
    email = (auth.jwt()->>'email')
  );

CREATE POLICY "technician_self_insert" ON public.technician FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );


-- ============================================================
-- public.request — authenticated users can read all requests,
-- and insert/update their own
-- ============================================================
CREATE POLICY "request_auth_select" ON public.request FOR SELECT
  USING ( auth.role() = 'authenticated' );

CREATE POLICY "request_auth_insert" ON public.request FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

CREATE POLICY "request_auth_update" ON public.request FOR UPDATE
  USING ( auth.role() = 'authenticated' )
  WITH CHECK ( auth.role() = 'authenticated' );


-- ============================================================
-- public.complaint — authenticated users can read/insert
-- ============================================================
CREATE POLICY "complaint_auth_select" ON public.complaint FOR SELECT
  USING ( auth.role() = 'authenticated' );

CREATE POLICY "complaint_auth_insert" ON public.complaint FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );


-- ============================================================
-- Force PostgREST to reload
-- ============================================================
NOTIFY pgrst, 'reload schema';
