-- Admin dashboard performance indexes
-- Safe, additive migration for faster status counts and recent-activity queries.

CREATE INDEX IF NOT EXISTS idx_request_status_created_at
  ON public.request (request_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_user_created_at
  ON public.request (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_service_type
  ON public.request (service_type);

CREATE INDEX IF NOT EXISTS idx_request_schedule_time
  ON public.request (schedule_time);

CREATE INDEX IF NOT EXISTS idx_complaint_status_created_at
  ON public.complaint (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_complaint_created_at
  ON public.complaint (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_technician_created_at
  ON public.technician (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_technician_specialty
  ON public.technician (specialty);

-- Expression indexes for mixed verification storage patterns.
CREATE INDEX IF NOT EXISTS idx_technician_verification_status_expr
  ON public.technician ((lower(coalesce(verification_status, ''))));

CREATE INDEX IF NOT EXISTS idx_technician_approval_status_expr
  ON public.technician ((lower(coalesce(approval_status, ''))));

CREATE INDEX IF NOT EXISTS idx_technician_status_expr
  ON public.technician ((lower(coalesce(status, ''))));

-- Optional helper index for email lookups used across auth-mapped reads.
CREATE INDEX IF NOT EXISTS idx_users_email_lower
  ON public.users ((lower(email)));

CREATE INDEX IF NOT EXISTS idx_technician_email_lower
  ON public.technician ((lower(email)));
