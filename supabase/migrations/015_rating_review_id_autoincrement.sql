-- ============================================================
-- Migration 015: Make review_id auto-increment
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS rating_review_id_seq
  OWNED BY public.rating.review_id;

SELECT setval('rating_review_id_seq', COALESCE((SELECT MAX(review_id) FROM public.rating), 0) + 1, false);

ALTER TABLE public.rating
  ALTER COLUMN review_id SET DEFAULT nextval('rating_review_id_seq');
