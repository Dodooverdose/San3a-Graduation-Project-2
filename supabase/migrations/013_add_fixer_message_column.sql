-- ============================================================
-- Migration 013: Add fixer_message column to request table
-- ============================================================
ALTER TABLE public.request ADD COLUMN IF NOT EXISTS fixer_message TEXT;
