-- ============================================================
-- Migration 019: Add complained_against_id column
-- ============================================================
-- Stores the ID of the user/customer the technician is filing
-- a complaint against.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaint' AND column_name = 'complained_against_id'
  ) THEN
    ALTER TABLE public.complaint ADD COLUMN complained_against_id BIGINT;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
