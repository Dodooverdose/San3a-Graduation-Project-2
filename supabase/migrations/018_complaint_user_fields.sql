-- ============================================================
-- Migration 018: Add user-facing complaint fields
-- ============================================================
-- Adds issue_type, request_id, and complainant_role columns
-- so customers and technicians can file complaints from their profile.
-- ============================================================

-- Add auto-increment default to complaint_id if it doesn't have one
DO $$
BEGIN
  -- Create a sequence for complaint_id if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'complaint_complaint_id_seq') THEN
    CREATE SEQUENCE public.complaint_complaint_id_seq;
    PERFORM setval('public.complaint_complaint_id_seq', GREATEST(COALESCE((SELECT MAX(complaint_id) FROM public.complaint), 0), 1));
    ALTER TABLE public.complaint ALTER COLUMN complaint_id SET DEFAULT nextval('public.complaint_complaint_id_seq');
    ALTER SEQUENCE public.complaint_complaint_id_seq OWNED BY public.complaint.complaint_id;
  END IF;
END $$;

-- Add new columns (safe: use DO block for conditional adds)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaint' AND column_name = 'issue_type'
  ) THEN
    ALTER TABLE public.complaint ADD COLUMN issue_type TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaint' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE public.complaint ADD COLUMN request_id BIGINT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaint' AND column_name = 'complainant_role'
  ) THEN
    ALTER TABLE public.complaint ADD COLUMN complainant_role TEXT DEFAULT 'customer';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaint' AND column_name = 'user_auth_id'
  ) THEN
    ALTER TABLE public.complaint ADD COLUMN user_auth_id UUID;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
