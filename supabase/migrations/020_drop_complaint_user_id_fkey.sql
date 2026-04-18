-- ============================================================
-- Migration 020: Add technician_id column to complaint
-- ============================================================
-- Stores the technician involved in the complaint so both
-- customer (user_id) and technician are always identifiable.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaint' AND column_name = 'technician_id'
  ) THEN
    ALTER TABLE public.complaint ADD COLUMN technician_id BIGINT;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
