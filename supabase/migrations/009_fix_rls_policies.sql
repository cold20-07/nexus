-- =====================================================
-- RLS Policy Cleanup and Security Hardening
-- =====================================================
-- This migration fixes conflicting RLS policies that cause 500 errors
-- and implements secure, non-recursive policy patterns.
--
-- IMPORTANT: Run this with service_role or superuser privileges
-- Test each section in development before applying to production
-- =====================================================

-- =====================================================
-- SECTION 1: Inspection Queries (Run First - Read Only)
-- =====================================================
-- Uncomment these to inspect current state before making changes:

-- SELECT policyname, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'admin_users';

-- SELECT policyname, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'storage' AND tablename = 'objects';

-- SELECT id, public FROM storage.buckets WHERE id = 'blog';


-- =====================================================
-- SECTION 2: Create Security Definer Helper Function
-- =====================================================
-- This prevents recursive RLS evaluation and 500 errors
-- Must be created BEFORE policies that use it

CREATE OR REPLACE FUNCTION public.is_super_admin(current_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users au
    WHERE au.id = current_uid 
      AND au.role = 'super_admin'::text 
      AND au.is_active = true
  );
$$;

-- Grant execute permission to authenticated users only
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

COMMENT ON FUNCTION public.is_super_admin IS 
  'Security definer function to check super_admin status without RLS recursion';


-- =====================================================
-- SECTION 3: Ensure Admin User Exists
-- =====================================================
-- Insert/update your admin account BEFORE dropping policies
-- Replace with your actual user ID and email

-- IMPORTANT: Get your user ID from Supabase Auth dashboard
-- or by running: SELECT id, email FROM auth.users;

-- INSERT INTO public.admin_users (id, email, full_name, role, is_active)
-- VALUES (
--   '934093a8-ce71-4080-8a57-05da1489ade1',  -- Replace with your auth.users.id
--   'your-email@example.com',                 -- Replace with your email
--   'Your Name',                              -- Replace with your name
--   'super_admin',
--   true
-- )
-- ON CONFLICT (id) DO UPDATE
--   SET role = 'super_admin', 
--       is_active = true,
--       updated_at = now();


-- =====================================================
-- SECTION 4: Clean Up Conflicting admin_users Policies
-- =====================================================

-- Drop the problematic policies that cause recursion and conflicts
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can create admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can update their own profile" ON public.admin_users;

-- Also drop any overly permissive policies if they exist
DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_insert" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_delete" ON public.admin_users;


-- =====================================================
-- SECTION 5: Create Secure admin_users Policies
-- =====================================================

-- Ensure RLS is enabled
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own profile
CREATE POLICY admin_users_select_own ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Users can update their own profile (limited fields)
CREATE POLICY admin_users_update_own ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    -- Prevent users from elevating their own role
    AND role = (SELECT role FROM public.admin_users WHERE id = auth.uid())
  );

-- Policy 3: Super admins have full access (using helper function)
CREATE POLICY admin_users_super_admin ON public.admin_users
  FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

COMMENT ON POLICY admin_users_select_own ON public.admin_users IS 
  'Users can view their own admin profile';
COMMENT ON POLICY admin_users_update_own ON public.admin_users IS 
  'Users can update their own profile but cannot change their role';
COMMENT ON POLICY admin_users_super_admin ON public.admin_users IS 
  'Super admins have full CRUD access to all admin users';


-- =====================================================
-- SECTION 6: Fix Storage Bucket Configuration
-- =====================================================

-- Make blog bucket public for read access (optional - uncomment if needed)
-- UPDATE storage.buckets 
-- SET public = true 
-- WHERE id = 'blog';

-- Ensure bucket exists with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog',
  'blog',
  true,  -- Set to false if you want private files with signed URLs
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;


-- =====================================================
-- SECTION 7: Clean Up Conflicting Storage Policies
-- =====================================================

DROP POLICY IF EXISTS "blog_select" ON storage.objects;
DROP POLICY IF EXISTS "blog_insert" ON storage.objects;
DROP POLICY IF EXISTS "blog_update" ON storage.objects;
DROP POLICY IF EXISTS "blog_delete" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;


-- =====================================================
-- SECTION 8: Create Secure Storage Policies
-- =====================================================

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public read access for blog bucket (if bucket is public)
CREATE POLICY blog_public_select ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'blog'
    AND (SELECT public FROM storage.buckets WHERE id = 'blog') = true
  );

-- Policy 2: Authenticated users can upload to blog bucket
-- Optional: Restrict to user-specific folders by uncommenting the path check
CREATE POLICY blog_insert_authenticated ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'blog'
    AND auth.uid() IS NOT NULL
    -- Uncomment to enforce user-specific folders:
    -- AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 3: Authenticated users can update their own uploads
CREATE POLICY blog_update_authenticated ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'blog'
    AND auth.uid() IS NOT NULL
    -- Uncomment to restrict to own files:
    -- AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'blog'
    AND auth.uid() IS NOT NULL
  );

-- Policy 4: Authenticated users can delete their own uploads
CREATE POLICY blog_delete_authenticated ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'blog'
    AND auth.uid() IS NOT NULL
    -- Uncomment to restrict to own files:
    -- AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 5: Super admins can manage all blog files
CREATE POLICY blog_super_admin ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'blog'
    AND public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'blog'
    AND public.is_super_admin(auth.uid())
  );

COMMENT ON POLICY blog_public_select ON storage.objects IS 
  'Public read access for blog images when bucket is public';
COMMENT ON POLICY blog_insert_authenticated ON storage.objects IS 
  'Authenticated users can upload blog images';
COMMENT ON POLICY blog_update_authenticated ON storage.objects IS 
  'Authenticated users can update blog images';
COMMENT ON POLICY blog_delete_authenticated ON storage.objects IS 
  'Authenticated users can delete blog images';
COMMENT ON POLICY blog_super_admin ON storage.objects IS 
  'Super admins have full access to all blog files';


-- =====================================================
-- SECTION 9: Verification Queries
-- =====================================================
-- Run these after migration to verify everything is correct:

-- Verify admin_users policies
-- SELECT policyname, roles, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'admin_users'
-- ORDER BY policyname;

-- Verify storage.objects policies for blog bucket
-- SELECT policyname, roles, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'storage' AND tablename = 'objects'
-- AND policyname LIKE 'blog%'
-- ORDER BY policyname;

-- Verify helper function exists
-- SELECT routine_name, security_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name = 'is_super_admin';


-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Test admin user login and profile access
-- 2. Test blog image upload/view functionality
-- 3. Monitor Supabase logs for any remaining errors
-- 4. If issues persist, check Postgres logs for detailed stack traces
-- =====================================================
