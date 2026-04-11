-- ============================================================
-- Migration 012: Mass-approve existing profiles for verification
-- ============================================================
-- Goal:
-- 1) Auto-link users/technicians to auth.users by email when auth_id is missing.
-- 2) Upsert profile_verification_submissions as approved for existing accounts.
-- 3) Keep specific account(s) rejected as requested.
--
-- Special rule requested:
-- - users email "omarkhaled2@gmail.com" stays rejected.
-- ============================================================

-- 1) Backfill users.auth_id from auth.users where missing and email matches.
UPDATE public.users u
SET auth_id = au.id
FROM auth.users au
WHERE u.auth_id IS NULL
  AND u.email IS NOT NULL
  AND lower(u.email) = lower(au.email);

-- 2) Backfill technician.auth_id from auth.users where missing and email matches.
UPDATE public.technician t
SET auth_id = au.id
FROM auth.users au
WHERE t.auth_id IS NULL
  AND t.email IS NOT NULL
  AND lower(t.email) = lower(au.email);

-- 3) Ensure all technicians are approved at technician table level.
UPDATE public.technician
SET
  is_verified = TRUE,
  verification_status = 'approved',
  verified_at = COALESCE(verified_at, NOW()),
  verification_notes = NULL
WHERE TRUE;

-- 4) Upsert verification submissions for existing users.
WITH source_users AS (
  SELECT
    u.auth_id,
    u.full_name,
    u.email,
    jsonb_build_object(
      'phoneNumber', u.phone_number,
      'source', 'migration-012-users'
    ) AS profile_details,
    CASE
      WHEN lower(coalesce(u.email, '')) = 'omarkhaled2@gmail.com' THEN 'rejected'
      ELSE 'approved'
    END AS review_status,
    CASE
      WHEN lower(coalesce(u.email, '')) = 'omarkhaled2@gmail.com'
        THEN 'Account intentionally kept rejected per admin request.'
      ELSE NULL
    END AS reviewer_notes
  FROM public.users u
  WHERE u.auth_id IS NOT NULL
)
INSERT INTO public.profile_verification_submissions (
  auth_id,
  account_type,
  full_name,
  email,
  profile_details,
  review_status,
  reviewer_notes,
  submitted_at,
  verification_completed_at,
  reviewed_at,
  reviewed_by_auth_id
)
SELECT
  su.auth_id,
  'user',
  su.full_name,
  su.email,
  su.profile_details,
  su.review_status,
  su.reviewer_notes,
  NOW(),
  NOW(),
  NOW(),
  NULL
FROM source_users su
ON CONFLICT (auth_id)
DO UPDATE SET
  account_type = EXCLUDED.account_type,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  profile_details = COALESCE(EXCLUDED.profile_details, profile_verification_submissions.profile_details),
  review_status = EXCLUDED.review_status,
  reviewer_notes = EXCLUDED.reviewer_notes,
  verification_completed_at = COALESCE(profile_verification_submissions.verification_completed_at, NOW()),
  reviewed_at = NOW(),
  reviewed_by_auth_id = NULL;

-- 5) Upsert verification submissions for existing technicians (all approved).
WITH source_technicians AS (
  SELECT
    t.auth_id,
    t.full_name,
    t.email,
    jsonb_build_object(
      'phoneNumber', t.phone_number,
      'specialty', t.specialty,
      'yearsOfExperience', t.years_of_experience,
      'source', 'migration-012-technicians'
    ) AS profile_details
  FROM public.technician t
  WHERE t.auth_id IS NOT NULL
)
INSERT INTO public.profile_verification_submissions (
  auth_id,
  account_type,
  full_name,
  email,
  profile_details,
  review_status,
  reviewer_notes,
  submitted_at,
  verification_completed_at,
  reviewed_at,
  reviewed_by_auth_id
)
SELECT
  st.auth_id,
  'technician',
  st.full_name,
  st.email,
  st.profile_details,
  'approved',
  NULL,
  NOW(),
  NOW(),
  NOW(),
  NULL
FROM source_technicians st
ON CONFLICT (auth_id)
DO UPDATE SET
  account_type = EXCLUDED.account_type,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  profile_details = COALESCE(EXCLUDED.profile_details, profile_verification_submissions.profile_details),
  review_status = 'approved',
  reviewer_notes = NULL,
  verification_completed_at = COALESCE(profile_verification_submissions.verification_completed_at, NOW()),
  reviewed_at = NOW(),
  reviewed_by_auth_id = NULL;

NOTIFY pgrst, 'reload schema';
