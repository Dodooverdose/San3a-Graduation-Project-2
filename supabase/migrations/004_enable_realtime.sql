-- ============================================================
-- Migration 004: Enable Realtime on request table
-- ============================================================
-- Supabase Realtime (postgres_changes) requires the table to be
-- added to the supabase_realtime publication. Without this,
-- realtime subscriptions won't receive any events.
-- ============================================================

-- Add request table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.request;

-- If already added, the above will error. Safe alternative:
-- DO $$ BEGIN
--   ALTER PUBLICATION supabase_realtime ADD TABLE public.request;
-- EXCEPTION WHEN duplicate_object THEN NULL;
-- END $$;
