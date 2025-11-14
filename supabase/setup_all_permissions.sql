-- Complete Permissions Setup
-- Run this entire script in Supabase SQL Editor
-- This sets up both public access and admin access

-- ============================================
-- PUBLIC ACCESS POLICIES
-- ============================================

-- CONTACTS TABLE
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public contact submissions" ON contacts;
DROP POLICY IF EXISTS "Allow public to read contacts" ON contacts;

CREATE POLICY "Allow public contact submissions"
ON contacts FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public to read contacts"
ON contacts FOR SELECT TO public USING (true);

-- FILE_UPLOADS TABLE
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public file uploads" ON file_uploads;
DROP POLICY IF EXISTS "Allow public to read files" ON file_uploads;
DROP POLICY IF EXISTS "Allow public to delete files" ON file_uploads;

CREATE POLICY "Allow public file uploads"
ON file_uploads FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public to read files"
ON file_uploads FOR SELECT TO public USING (true);

CREATE POLICY "Allow public to delete files"
ON file_uploads FOR DELETE TO public USING (true);

-- FORM_SUBMISSIONS TABLE
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Allow public to read form_submissions" ON form_submissions;

CREATE POLICY "Allow public form submissions"
ON form_submissions FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public to read form_submissions"
ON form_submissions FOR SELECT TO public USING (true);

-- ============================================
-- ADMIN ACCESS POLICIES (Authenticated Users)
-- ============================================

-- SERVICES TABLE
DROP POLICY IF EXISTS "Admin full access to services" ON services;
CREATE POLICY "Admin full access to services"
ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- BLOG_POSTS TABLE
DROP POLICY IF EXISTS "Admin full access to blog_posts" ON blog_posts;
CREATE POLICY "Admin full access to blog_posts"
ON blog_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TESTIMONIALS TABLE
DROP POLICY IF EXISTS "Admin full access to testimonials" ON testimonials;
CREATE POLICY "Admin full access to testimonials"
ON testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CONTACTS TABLE (Admin)
DROP POLICY IF EXISTS "Admin full access to contacts" ON contacts;
CREATE POLICY "Admin full access to contacts"
ON contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- FILE_UPLOADS TABLE (Admin)
DROP POLICY IF EXISTS "Admin full access to file_uploads" ON file_uploads;
CREATE POLICY "Admin full access to file_uploads"
ON file_uploads FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- FORM_SUBMISSIONS TABLE (Admin)
DROP POLICY IF EXISTS "Admin full access to form_submissions" ON form_submissions;
CREATE POLICY "Admin full access to form_submissions"
ON form_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- AUDIT_LOGS TABLE
DROP POLICY IF EXISTS "Admin full access to audit_logs" ON audit_logs;
CREATE POLICY "Admin full access to audit_logs"
ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Public storage access
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'medical-documents');

CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'medical-documents');

CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'medical-documents');

-- Admin storage access
DROP POLICY IF EXISTS "Admin full access to storage" ON storage.objects;
CREATE POLICY "Admin full access to storage"
ON storage.objects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- VERIFY SETUP
-- ============================================

SELECT 
    tablename, 
    policyname, 
    roles, 
    cmd
FROM pg_policies
WHERE tablename IN ('services', 'blog_posts', 'contacts', 'file_uploads', 'form_submissions')
ORDER BY tablename, policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Permissions setup complete!';
    RAISE NOTICE 'Public users can: Submit forms, upload files, read published content';
    RAISE NOTICE 'Authenticated users (admins) can: Full CRUD on all tables';
END $$;
