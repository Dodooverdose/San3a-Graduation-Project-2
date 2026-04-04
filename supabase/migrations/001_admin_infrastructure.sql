-- Migration: Setup Admin Infrastructure
-- Description: Creates tables and policies for admin dashboard management
-- Run this migration in Supabase SQL Editor

-- 1. Create admin_users table (optional, for additional admin metadata)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  permissions TEXT[] DEFAULT '{view_technicians,view_users,view_requests,view_complaints}'::text[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for admin_users
CREATE POLICY "Admins can view all admin users" ON public.admin_users
  FOR SELECT USING (
    auth.jwt()->>'role' = 'authenticated' AND 
    auth.uid() IN (
      SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role') = 'admin'
    )
  );

CREATE POLICY "Only system can insert admin users" ON public.admin_users
  FOR INSERT WITH CHECK (FALSE);

CREATE POLICY "Admins can update admin users" ON public.admin_users
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role') = 'admin'
    )
  );

-- 4. Ensure required tables have RLS enabled with admin access
-- Tables: technician, users, request, complaint

-- Enable RLS on technician table
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'technician') THEN
    ALTER TABLE public.technician ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can access all technicians" ON public.technician;
    CREATE POLICY "Admins can access all technicians" ON public.technician
      USING (
        auth.uid() IN (
          SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role') = 'admin'
        )
      );
  END IF;
END $$;

-- Enable RLS on users table
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can access all users" ON public.users;
    CREATE POLICY "Admins can access all users" ON public.users
      USING (
        auth.uid() IN (
          SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role') = 'admin'
        )
      );
  END IF;
END $$;

-- Enable RLS on request table
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'request') THEN
    ALTER TABLE public.request ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can access all requests" ON public.request;
    CREATE POLICY "Admins can access all requests" ON public.request
      USING (
        auth.uid() IN (
          SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role') = 'admin'
        )
      );
  END IF;
END $$;

-- Enable RLS on complaint table
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaint') THEN
    ALTER TABLE public.complaint ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can access all complaints" ON public.complaint;
    CREATE POLICY "Admins can access all complaints" ON public.complaint
      USING (
        auth.uid() IN (
          SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role') = 'admin'
        )
      );
  END IF;
END $$;

-- 5. Create a function to promote a user to admin (optional helper function)
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
RETURNS TABLE (id UUID, email TEXT, role TEXT)
LANGUAGE sql
AS $$
  UPDATE auth.users 
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb), 
    '{role}', 
    '"admin"'::jsonb
  )
  WHERE email = user_email
  RETURNING id, email, raw_user_meta_data->>'role' as role;
$$;

-- 6. Create an audit log table for admin actions (optional)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.admin_audit_log
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role') = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.make_user_admin TO authenticated;
