-- ============================================================
-- Migration 014: Add RLS policies for the rating table
-- ============================================================
-- Allows authenticated users (customers & technicians) to
-- insert and update rows in the rating table.
-- ============================================================

-- Enable RLS if not already enabled
ALTER TABLE public.rating ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read ratings
CREATE POLICY "rating_select_authenticated" ON public.rating FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- Any authenticated user can insert a rating
CREATE POLICY "rating_insert_authenticated" ON public.rating FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

-- Any authenticated user can update a rating
CREATE POLICY "rating_update_authenticated" ON public.rating FOR UPDATE
  USING ( auth.role() = 'authenticated' )
  WITH CHECK ( auth.role() = 'authenticated' );
