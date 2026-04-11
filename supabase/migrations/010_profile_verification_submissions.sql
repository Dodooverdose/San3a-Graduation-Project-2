-- ============================================================
-- Migration 010: Profile verification submissions for users and technicians
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profile_verification_submissions (
  auth_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('user', 'technician')),
  full_name TEXT,
  email TEXT,
  profile_details JSONB,
  national_id_front_image TEXT,
  national_id_back_image TEXT,
  selfie_image TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by_auth_id UUID REFERENCES auth.users(id)
);

ALTER TABLE public.profile_verification_submissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_profile_verification_submissions_status
  ON public.profile_verification_submissions (review_status);

CREATE INDEX IF NOT EXISTS idx_profile_verification_submissions_account_type
  ON public.profile_verification_submissions (account_type);

CREATE INDEX IF NOT EXISTS idx_profile_verification_submissions_submitted_at
  ON public.profile_verification_submissions (submitted_at DESC);

DROP POLICY IF EXISTS profile_verification_owner_select ON public.profile_verification_submissions;
DROP POLICY IF EXISTS profile_verification_owner_insert ON public.profile_verification_submissions;
DROP POLICY IF EXISTS profile_verification_owner_update ON public.profile_verification_submissions;
DROP POLICY IF EXISTS profile_verification_admin_select ON public.profile_verification_submissions;
DROP POLICY IF EXISTS profile_verification_admin_update ON public.profile_verification_submissions;

CREATE POLICY profile_verification_owner_select
  ON public.profile_verification_submissions
  FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY profile_verification_owner_insert
  ON public.profile_verification_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY profile_verification_owner_update
  ON public.profile_verification_submissions
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY profile_verification_admin_select
  ON public.profile_verification_submissions
  FOR SELECT
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

CREATE POLICY profile_verification_admin_update
  ON public.profile_verification_submissions
  FOR UPDATE
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

REVOKE ALL ON public.profile_verification_submissions FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.profile_verification_submissions TO authenticated;

NOTIFY pgrst, 'reload schema';
