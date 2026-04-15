-- Migration 016: Fix NULL request_status values and add default
-- Any existing requests with NULL status are set to 'pending'.
-- A DEFAULT is added so future inserts always have a status.

UPDATE public.request
SET request_status = 'pending'
WHERE request_status IS NULL;

ALTER TABLE public.request
  ALTER COLUMN request_status SET DEFAULT 'pending';
