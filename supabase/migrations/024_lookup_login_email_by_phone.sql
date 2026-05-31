-- Resolve a login email from a phone number for email/password auth.
-- This runs server-side so it can read protected profile tables before sign-in.

CREATE OR REPLACE FUNCTION public.lookup_login_email_by_phone(phone_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_phone TEXT := trim(phone_input);
  normalized_digits TEXT := regexp_replace(coalesce(trim(phone_input), ''), '\\D', '', 'g');
  found_email TEXT;
BEGIN
  IF normalized_phone IS NULL OR normalized_phone = '' THEN
    RETURN NULL;
  END IF;

  SELECT a.email INTO found_email
  FROM public.admin a
  WHERE regexp_replace(coalesce(a.phone_number, ''), '\\D', '', 'g') = normalized_digits
  LIMIT 1;

  IF found_email IS NOT NULL THEN
    RETURN found_email;
  END IF;

  SELECT u.email INTO found_email
  FROM public.users u
  WHERE regexp_replace(coalesce(u.phone_number, ''), '\\D', '', 'g') = normalized_digits
  LIMIT 1;

  IF found_email IS NOT NULL THEN
    RETURN found_email;
  END IF;

  SELECT t.email INTO found_email
  FROM public.technician t
  WHERE regexp_replace(coalesce(t.phone_number, ''), '\\D', '', 'g') = normalized_digits
  LIMIT 1;

  RETURN found_email;
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_login_email_by_phone(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_login_email_by_phone(TEXT) TO anon, authenticated;