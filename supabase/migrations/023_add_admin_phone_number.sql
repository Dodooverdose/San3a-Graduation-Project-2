-- Add phone numbers to admin accounts so admins can log in with a phone identifier.

ALTER TABLE public.admin
ADD COLUMN IF NOT EXISTS phone_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS admin_phone_number_key
  ON public.admin (phone_number)
  WHERE phone_number IS NOT NULL;