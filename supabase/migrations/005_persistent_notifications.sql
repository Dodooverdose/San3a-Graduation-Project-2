-- Migration 005: Persistent notification center
-- Stores in-app notification history so users can reopen the app and see prior notifications.

CREATE TABLE IF NOT EXISTS public.notification_center (
  id BIGSERIAL PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  request_id TEXT,
  route_path TEXT,
  notification_type TEXT DEFAULT 'general',
  icon TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_center_recipient_email_created_at_idx
  ON public.notification_center (recipient_email, created_at DESC);

CREATE OR REPLACE FUNCTION public.create_notification_center_entry(
  recipient_email_input TEXT,
  title_input TEXT,
  message_input TEXT,
  request_id_input TEXT DEFAULT NULL,
  route_path_input TEXT DEFAULT NULL,
  notification_type_input TEXT DEFAULT 'general',
  icon_input TEXT DEFAULT NULL,
  payload_input JSONB DEFAULT '{}'::jsonb,
  is_read_input BOOLEAN DEFAULT FALSE,
  read_at_input TIMESTAMPTZ DEFAULT NULL
)
RETURNS public.notification_center
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_row public.notification_center;
BEGIN
  INSERT INTO public.notification_center (
    recipient_email,
    title,
    message,
    request_id,
    route_path,
    notification_type,
    icon,
    payload,
    is_read,
    read_at
  ) VALUES (
    recipient_email_input,
    title_input,
    message_input,
    request_id_input,
    route_path_input,
    notification_type_input,
    icon_input,
    payload_input,
    is_read_input,
    read_at_input
  )
  RETURNING * INTO inserted_row;

  RETURN inserted_row;
END;
$$;

ALTER TABLE public.notification_center ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_center_select_own" ON public.notification_center;
CREATE POLICY "notification_center_select_own" ON public.notification_center
  FOR SELECT
  USING (recipient_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "notification_center_insert_own" ON public.notification_center;
CREATE POLICY "notification_center_insert_own" ON public.notification_center
  FOR INSERT
  WITH CHECK (recipient_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "notification_center_update_own" ON public.notification_center;
CREATE POLICY "notification_center_update_own" ON public.notification_center
  FOR UPDATE
  USING (recipient_email = auth.jwt()->>'email')
  WITH CHECK (recipient_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "notification_center_delete_own" ON public.notification_center;
CREATE POLICY "notification_center_delete_own" ON public.notification_center
  FOR DELETE
  USING (recipient_email = auth.jwt()->>'email');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_center TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification_center_entry(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  BOOLEAN,
  TIMESTAMPTZ
) TO authenticated;
