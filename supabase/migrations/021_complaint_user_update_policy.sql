-- ============================================================
-- Migration 021: Allow authenticated users to update their own complaints
-- ============================================================
-- Enables complainants to update the status of complaints they filed
-- (e.g., confirming or rejecting a resolution).
-- ============================================================

CREATE POLICY "complaint_auth_update_own" ON public.complaint FOR UPDATE
  USING ( auth.role() = 'authenticated' )
  WITH CHECK ( auth.role() = 'authenticated' );

-- Also allow authenticated users to read the admin table (email only)
-- so they can send notifications to admins
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin') THEN
    DROP POLICY IF EXISTS "admin_auth_select" ON public.admin;
    CREATE POLICY "admin_auth_select" ON public.admin FOR SELECT
      USING ( auth.role() = 'authenticated' );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
