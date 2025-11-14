-- Form Submissions Table
-- Flexible storage for all form types with JSONB data

CREATE TABLE form_submissions (
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

-- Link file uploads to form submissions
ALTER TABLE file_uploads 
ADD COLUMN form_submission_id UUID REFERENCES form_submissions(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_form_submissions_type ON form_submissions(form_type);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_created ON form_submissions(created_at DESC);
CREATE INDEX idx_form_submissions_email ON form_submissions(email);
CREATE INDEX idx_file_uploads_form_submission ON file_uploads(form_submission_id);

-- RLS Policies
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit forms"
    ON form_submissions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view their own submissions"
    ON form_submissions FOR SELECT
    USING (true);

-- Update file_uploads policy for form submissions
CREATE POLICY "Anyone can upload files with form submission"
    ON file_uploads FOR INSERT
    WITH CHECK (form_submission_id IS NOT NULL OR contact_id IS NOT NULL);

-- Update trigger
CREATE TRIGGER update_form_submissions_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE form_submissions IS 'All form submissions - contains PHI';
COMMENT ON COLUMN form_submissions.form_data IS 'JSONB storage for form-specific fields';
