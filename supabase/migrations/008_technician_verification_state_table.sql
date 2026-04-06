-- ============================================================
-- Migration 008: Technician verification state table
-- ============================================================
-- This model works with your current technician schema
-- (technician_id, full_name, phone_number, email, specialty, date_created, auth_id).
-- It keeps verification data separate and avoids writing columns that may not exist
-- on the technician table in long-lived environments.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.technician_verification_state (
  technician_id INTEGER PRIMARY KEY,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.technician_verification_state ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'technician_verification_state_status_chk'
  ) THEN
    ALTER TABLE public.technician_verification_state
      ADD CONSTRAINT technician_verification_state_status_chk
      CHECK (verification_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_technician_verification_state_status
  ON public.technician_verification_state (verification_status);

CREATE INDEX IF NOT EXISTS idx_technician_verification_state_verified
  ON public.technician_verification_state (is_verified);

CREATE OR REPLACE FUNCTION public.sync_technician_verification_state_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  NEW.verification_status := lower(COALESCE(NEW.verification_status, 'pending'));

  IF NEW.verification_status = 'approved' THEN
    NEW.is_verified := TRUE;
    NEW.verified_at := COALESCE(NEW.verified_at, NOW());
  ELSE
    NEW.is_verified := FALSE;
    IF NEW.verification_status NOT IN ('pending', 'rejected') THEN
      NEW.verification_status := 'pending';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_technician_verification_state_updated_at ON public.technician_verification_state;

CREATE TRIGGER trg_sync_technician_verification_state_updated_at
BEFORE INSERT OR UPDATE ON public.technician_verification_state
FOR EACH ROW
EXECUTE FUNCTION public.sync_technician_verification_state_updated_at();

-- Backfill all existing technicians as approved.
INSERT INTO public.technician_verification_state (
  technician_id,
  is_verified,
  verification_status,
  verified_at
)
SELECT
  t.technician_id,
  TRUE,
  'approved',
  COALESCE(v.verified_at, NOW())
FROM public.technician t
LEFT JOIN public.technician_verification_state v
  ON v.technician_id = t.technician_id
ON CONFLICT (technician_id) DO UPDATE
SET
  is_verified = EXCLUDED.is_verified,
  verification_status = EXCLUDED.verification_status,
  verified_at = EXCLUDED.verified_at,
  updated_at = NOW();

-- Read-only helper view for the app and Supabase API.
-- Drop first to avoid column-shape conflicts with previously created versions.
DROP VIEW IF EXISTS public.technician_verification_state_v;

CREATE VIEW public.technician_verification_state_v (
  technician_id,
  full_name,
  email,
  phone_number,
  specialty,
  date_created,
  auth_id,
  is_verified,
  verification_status,
  verified_at,
  verification_notes
) AS
SELECT
  t.technician_id,
  t.full_name,
  t.email,
  t.phone_number,
  t.specialty,
  t.date_created,
  t.auth_id,
  COALESCE(v.is_verified, FALSE) AS is_verified,
  COALESCE(v.verification_status, 'pending') AS verification_status,
  v.verified_at,
  v.verification_notes
FROM public.technician t
LEFT JOIN public.technician_verification_state v
  ON v.technician_id = t.technician_id
WHERE (auth.jwt()->'user_metadata'->>'role') = 'admin';

ALTER VIEW public.technician_verification_state_v SET (security_invoker = true);

REVOKE ALL ON public.technician_verification_state_v FROM anon;
REVOKE ALL ON public.technician_verification_state_v FROM authenticated;
GRANT SELECT ON public.technician_verification_state_v TO authenticated;

REVOKE ALL ON public.technician_verification_state FROM anon;
REVOKE ALL ON public.technician_verification_state FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_verification_state TO authenticated;

DROP POLICY IF EXISTS technician_ver_state_admin_select ON public.technician_verification_state;
DROP POLICY IF EXISTS technician_ver_state_admin_insert ON public.technician_verification_state;
DROP POLICY IF EXISTS technician_ver_state_admin_update ON public.technician_verification_state;
DROP POLICY IF EXISTS technician_ver_state_admin_delete ON public.technician_verification_state;

CREATE POLICY technician_ver_state_admin_select
  ON public.technician_verification_state
  FOR SELECT
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

CREATE POLICY technician_ver_state_admin_insert
  ON public.technician_verification_state
  FOR INSERT
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

CREATE POLICY technician_ver_state_admin_update
  ON public.technician_verification_state
  FOR UPDATE
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');

CREATE POLICY technician_ver_state_admin_delete
  ON public.technician_verification_state
  FOR DELETE
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

NOTIFY pgrst, 'reload schema';
