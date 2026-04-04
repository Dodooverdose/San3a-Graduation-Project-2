# Admin Dashboard - Supabase Setup Guide

## Overview
The Admin Dashboard requires users to have the `admin` role set in their Supabase user metadata. This guide explains how to set up admin users.

## Setup Steps

### 1. Create Admin Users in Supabase Auth

Admin accounts should be created in the Supabase Authentication system. You can do this either through:

**Option A: Supabase Dashboard**
- Go to Authentication → Users
- Click "Add user"
- Enter email and password
- Save the user

**Option B: Programmatically via SQL/Functions**
Use a Supabase Admin API or create a migration

### 2. Set the Admin Role in User Metadata

After creating a user, you need to set their role to `admin` in the user metadata. 

**Via Supabase SQL Editor:**
```sql
-- Run this as a database admin or use Supabase dashboard
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"admin"'::jsonb
)
WHERE email = 'admin@example.com';
```

**Via Supabase Dashboard:**
1. Go to Authentication → Users
2. Click on the user you want to make admin
3. In "User Metadata" section, add:
   ```json
   {
     "role": "admin"
   }
   ```
4. Save

### 3. Database Tables Structure (Optional but Recommended)

If you want to manage admins through a separate database table, create this table:

```sql
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only authenticated admins can view admin list
CREATE POLICY "Only admins can view admin users" ON public.admin_users
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role') = 'admin'
    )
  );
```

### 4. Testing the Admin Dashboard

1. **Create an admin user** in Supabase with email and password
2. **Set the role** to `admin` in user metadata
3. **Sign in** to the application using admin credentials
4. **Click "Admin Dashboard"** button - you should now have access

If you get an error:
- Verify the user's role is set to `admin` in metadata
- Check browser console for detailed error messages
- Ensure you're signed in with the correct admin account

## Troubleshooting

### Issue: "You do not have admin privileges"
**Solution:** 
- Check that the user's metadata has `role: admin`
- Verify the role value is exactly `"admin"` (lowercase, as a string)
- Sign out and sign in again to refresh the session

### Issue: "Please sign in with admin credentials first"
**Solution:**
- Sign in with your admin email/password first
- Then click the "Admin Dashboard" button

### Issue: Button clicks but shows error
**Solution:**
- Check browser developer console (F12) for error messages
- Verify Supabase connection is working
- Ensure user session is still valid

## Database Access Setup

The admin views require access to these tables. Ensure RLS policies are set up appropriately:

**Required tables:**
- `technicians` - Technician management
- `customers` - Customer management
- `request` - Service requests
- `verifications` - Technician verifications
- `complaints` - Customer complaints

### Example RLS Policy for Admin Access:

```sql
-- Allow admins to access any table
CREATE POLICY "Admins have full access" ON <table_name>
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role') = 'admin'
    )
  );
```

## User Roles Reference

- `admin` - Full access to admin dashboard
- `fixer` - Service provider/technician access
- `customer` - Regular customer access (default)
- `null` - Regular user if not specified

Set the role via user metadata:
```json
{
  "role": "admin" | "fixer" | "customer"
}
```
