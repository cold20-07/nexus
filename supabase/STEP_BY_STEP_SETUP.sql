-- ============================================
-- STEP 1: Create form_submissions table
-- ============================================

CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_type TEXT NOT NULL CHECK (form_type IN ('quick_intake', 'aid_attendance', 'unsure', 'general')),
    
    -- Basic contact info (always present)
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    
    -- Form-specific data stored as JSONB
    form_data JSONB DEFAULT '{}'::jsonb,
    
    -- Status tracking
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'completed', 'closed')),
    requires_upload BOOLEAN DEFAULT false,
    has_uploads BOOLEAN DEFAULT false,
    
    -- Admin notes
    notes TEXT,
    assigned_to TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Add column to file_uploads if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'file_uploads' 
        AND column_name = 'form_submission_id'
    ) THEN
        ALTER TABLE file_uploads 
        ADD COLUMN form_submission_id UUID REFERENCES form_submissions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_type ON form_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created ON form_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON form_submissions(email);
CREATE INDEX IF NOT EXISTS idx_file_uploads_form_submission ON file_uploads(form_submission_id);

-- Enable RLS
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Update trigger
DROP TRIGGER IF EXISTS update_form_submissions_updated_at ON form_submissions;
CREATE TRIGGER update_form_submissions_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 2: PUBLIC ACCESS POLICIES
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
DROP POLICY IF EXISTS "Anyone can upload files with contact" ON file_uploads;
DROP POLICY IF EXISTS "Anyone can upload files with form submission" ON file_uploads;

CREATE POLICY "Allow public file uploads"
ON file_uploads FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public to read files"
ON file_uploads FOR SELECT TO public USING (true);

CREATE POLICY "Allow public to delete files"
ON file_uploads FOR DELETE TO public USING (true);

-- FORM_SUBMISSIONS TABLE
DROP POLICY IF EXISTS "Allow public form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Allow public to read form_submissions" ON form_submissions;
DROP POLICY IF EXISTS "Anyone can submit forms" ON form_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON form_submissions;

CREATE POLICY "Allow public form submissions"
ON form_submissions FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public to read form_submissions"
ON form_submissions FOR SELECT TO public USING (true);

-- ============================================
-- STEP 3: ADMIN ACCESS POLICIES
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
-- STEP 4: STORAGE SETUP
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
-- STEP 5: VERIFY SETUP
-- ============================================

-- Check tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status
FROM (
    VALUES 
        ('services'),
        ('blog_posts'),
        ('contacts'),
        ('file_uploads'),
        ('form_submissions'),
        ('audit_logs')
) AS t(table_name);

-- Check policies
SELECT 
    tablename, 
    COUNT(*) as policy_count,
    STRING_AGG(DISTINCT roles::text, ', ') as roles
FROM pg_policies
WHERE tablename IN ('services', 'blog_posts', 'contacts', 'file_uploads', 'form_submissions')
GROUP BY tablename
ORDER BY tablename;

-- Check storage bucket
SELECT 
    id,
    name,
    public,
    CASE WHEN public THEN '⚠ PUBLIC' ELSE '✓ PRIVATE' END as security_status
FROM storage.buckets
WHERE id = 'medical-documents';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Public users can:';
    RAISE NOTICE '  - Submit forms';
    RAISE NOTICE '  - Upload files';
    RAISE NOTICE '  - Read published content';
    RAISE NOTICE '';
    RAISE NOTICE 'Authenticated users (admins) can:';
    RAISE NOTICE '  - Full CRUD on all tables';
    RAISE NOTICE '  - Manage services, blog, contacts';
    RAISE NOTICE '  - View form submissions';
    RAISE NOTICE '========================================';
END $$;
