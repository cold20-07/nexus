-- Admin Permissions for Authenticated Users
-- Run this in Supabase SQL Editor to allow admin users to manage data

-- ============================================
-- CONTACTS - Allow authenticated users to delete
-- ============================================

DROP POLICY IF EXISTS "Allow authenticated to delete contacts" ON contacts;

CREATE POLICY "Allow authenticated to delete contacts"
ON contacts
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated to update contacts"
ON contacts
FOR UPDATE
TO authenticated
USING (true);

-- ============================================
-- SERVICES - Allow authenticated users to update
-- ============================================

DROP POLICY IF EXISTS "Allow authenticated to update services" ON services;
DROP POLICY IF EXISTS "Allow authenticated to insert services" ON services;
DROP POLICY IF EXISTS "Allow authenticated to delete services" ON services;

CREATE POLICY "Allow authenticated to update services"
ON services
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated to insert services"
ON services
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated to delete services"
ON services
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- BLOG POSTS - Allow authenticated users to manage
-- ============================================

DROP POLICY IF EXISTS "Allow authenticated to update blog" ON blog_posts;
DROP POLICY IF EXISTS "Allow authenticated to insert blog" ON blog_posts;
DROP POLICY IF EXISTS "Allow authenticated to delete blog" ON blog_posts;

CREATE POLICY "Allow authenticated to update blog"
ON blog_posts
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated to insert blog"
ON blog_posts
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated to delete blog"
ON blog_posts
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- FILE UPLOADS - Allow authenticated users to manage
-- ============================================

DROP POLICY IF EXISTS "Allow authenticated to update files" ON file_uploads;

CREATE POLICY "Allow authenticated to update files"
ON file_uploads
FOR UPDATE
TO authenticated
USING (true);

-- ============================================
-- VERIFY POLICIES
-- ============================================

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies
WHERE tablename IN ('contacts', 'services', 'blog_posts', 'file_uploads')
ORDER BY tablename, policyname;
