-- ============================================================
-- Migration 007: Technician verification model
-- ============================================================
-- Goal:
-- 1) Add explicit verification fields.
-- 2) Backfill ALL existing technicians as verified (per current requirement).
-- 3) Keep NEW technicians unverified/pending by default.
-- 4) Provide a clean view for admin logic/reporting.
-- ============================================================

-- 1) Add verification columns (safe if re-run)
ALTER TABLE public.technician
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN,
  ADD COLUMN IF NOT EXISTS verification_status TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- 2) Defaults for new technicians
ALTER TABLE public.technician
  ALTER COLUMN is_verified SET DEFAULT FALSE,
  ALTER COLUMN verification_status SET DEFAULT 'pending';

-- 3) Add status constraint safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'technician_verification_status_chk'
  ) THEN
    ALTER TABLE public.technician
      ADD CONSTRAINT technician_verification_status_chk
      CHECK (verification_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- 4) Backfill existing rows as VERIFIED (requested behavior)
UPDATE public.technician
SET
  is_verified = TRUE,
  verification_status = 'approved',
  verified_at = COALESCE(verified_at, NOW())
WHERE TRUE;

-- 5) Keep fields in sync when one of them is updated
CREATE OR REPLACE FUNCTION public.sync_technician_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalize status text if provided
  IF NEW.verification_status IS NOT NULL THEN
    NEW.verification_status := lower(NEW.verification_status);
  END IF;

  -- Status drives boolean
  IF NEW.verification_status = 'approved' THEN
    NEW.is_verified := TRUE;
    NEW.verified_at := COALESCE(NEW.verified_at, NOW());
  ELSIF NEW.verification_status IN ('pending', 'rejected') THEN
    NEW.is_verified := FALSE;
  END IF;

  -- Boolean can also drive status when status absent
  IF NEW.verification_status IS NULL THEN
    NEW.verification_status := CASE WHEN COALESCE(NEW.is_verified, FALSE) THEN 'approved' ELSE 'pending' END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_technician_verification_fields ON public.technician;

CREATE TRIGGER trg_sync_technician_verification_fields
BEFORE INSERT OR UPDATE ON public.technician
FOR EACH ROW
EXECUTE FUNCTION public.sync_technician_verification_fields();

-- 6) Helpful index for admin verification screens
CREATE INDEX IF NOT EXISTS idx_technician_verification_status
  ON public.technician (verification_status);

-- 7) Admin-friendly logical view
CREATE OR REPLACE VIEW public.technician_verification_state_v AS
SELECT
  t.technician_id,
  t.full_name,
  t.email,
  t.specialty,
  COALESCE(t.verification_status, CASE WHEN COALESCE(t.is_verified, FALSE) THEN 'approved' ELSE 'pending' END) AS verification_status,
  COALESCE(t.is_verified, FALSE) AS is_verified,
  t.verified_at,
  t.date_created
FROM public.technician t;

ALTER VIEW public.technician_verification_state_v SET (security_invoker = true);

REVOKE ALL ON public.technician_verification_state_v FROM anon;
GRANT SELECT ON public.technician_verification_state_v TO authenticated;

NOTIFY pgrst, 'reload schema';
