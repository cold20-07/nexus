-- Add claim_readiness_review to form_submissions form_type check constraint

-- Drop the existing constraint
ALTER TABLE form_submissions DROP CONSTRAINT IF EXISTS form_submissions_form_type_check;

-- Add new constraint with claim_readiness_review included
ALTER TABLE form_submissions 
ADD CONSTRAINT form_submissions_form_type_check 
CHECK (form_type IN ('quick_intake', 'aid_attendance', 'unsure', 'general', 'claim_readiness_review'));

-- Comment
COMMENT ON CONSTRAINT form_submissions_form_type_check ON form_submissions IS 'Allowed form types including claim_readiness_review';
