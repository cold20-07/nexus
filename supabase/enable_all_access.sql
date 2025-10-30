-- Enable full public access for contact forms and file uploads
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- CONTACTS TABLE - Allow public inserts
-- ============================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public contact submissions" ON contacts;

CREATE POLICY "Allow public contact submissions"
ON contacts
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public to read contacts"
ON contacts
FOR SELECT
TO public
USING (true);

-- ============================================
-- FILE_UPLOADS TABLE - Allow public access
-- ============================================

ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public file uploads" ON file_uploads;
DROP POLICY IF EXISTS "Allow public to read files" ON file_uploads;
DROP POLICY IF EXISTS "Allow public to delete files" ON file_uploads;

CREATE POLICY "Allow public file uploads"
ON file_uploads
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public to read files"
ON file_uploads
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public to delete files"
ON file_uploads
FOR DELETE
TO public
USING (true);

-- ============================================
-- STORAGE - medical-documents bucket
-- ============================================

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- Create storage policies
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'medical-documents');

CREATE POLICY "Allow public downloads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'medical-documents');

CREATE POLICY "Allow public deletes"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'medical-documents');

-- ============================================
-- VERIFY POLICIES WERE CREATED
-- ============================================

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies
WHERE tablename IN ('contacts', 'file_uploads')
ORDER BY tablename, policyname;

-- Check storage policies
SELECT 
    policyname,
    tablename,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%public%'
ORDER BY policyname;
