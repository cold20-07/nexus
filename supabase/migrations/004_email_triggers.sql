-- Email Notification Triggers
-- Creates database triggers to automatically send emails when forms are submitted

-- ============================================
-- ENABLE HTTP EXTENSION
-- ============================================

-- Enable the HTTP extension for making HTTP requests from triggers
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- ============================================
-- CONFIGURATION - UPDATE THESE VALUES
-- ============================================

-- IMPORTANT: Replace these with your actual values before running
-- Find your project ref in: https://supabase.com/dashboard/project/YOUR-PROJECT-REF
-- Find your service role key in: Settings > API > service_role

-- Example: https://abcdefghijklmnop.supabase.co
CREATE OR REPLACE FUNCTION get_supabase_url()
RETURNS TEXT AS $$
BEGIN
  -- TODO: Replace with your actual Supabase project URL
  RETURN 'https://YOUR-PROJECT-REF.supabase.co';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_service_role_key()
RETURNS TEXT AS $$
BEGIN
  -- TODO: Replace with your actual service role key
  RETURN 'YOUR-SERVICE-ROLE-KEY';
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION TO GET SUPABASE FUNCTION URL
-- ============================================

CREATE OR REPLACE FUNCTION get_function_url(function_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN get_supabase_url() || '/functions/v1/' || function_name;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- CONTACT SUBMISSION NOTIFICATION TRIGGER
-- ============================================

-- Function to notify when a contact is submitted
CREATE OR REPLACE FUNCTION notify_contact_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Make async HTTP POST request to Edge Function
  PERFORM net.http_post(
    url := get_function_url('notify-contact-submission'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || get_service_role_key()
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send contact notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on contacts table
DROP TRIGGER IF EXISTS on_contact_insert ON contacts;
CREATE TRIGGER on_contact_insert
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION notify_contact_submission();

-- ============================================
-- FORM SUBMISSION NOTIFICATION TRIGGER
-- ============================================

-- Function to notify when a form submission is created
CREATE OR REPLACE FUNCTION notify_form_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Make async HTTP POST request to Edge Function
  PERFORM net.http_post(
    url := get_function_url('notify-form-submission'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || get_service_role_key()
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send form submission notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on form_submissions table
DROP TRIGGER IF EXISTS on_form_submission_insert ON form_submissions;
CREATE TRIGGER on_form_submission_insert
  AFTER INSERT ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_form_submission();

-- ============================================
-- UPDATE CONFIGURATION FUNCTIONS
-- ============================================

-- After running this migration, you MUST update the configuration functions above
-- Run these commands in the SQL Editor:

-- UPDATE get_supabase_url() function:
/*
CREATE OR REPLACE FUNCTION get_supabase_url()
RETURNS TEXT AS $$
BEGIN
  RETURN 'https://YOUR-ACTUAL-PROJECT-REF.supabase.co';
END;
$$ LANGUAGE plpgsql IMMUTABLE;
*/

-- UPDATE get_service_role_key() function:
/*
CREATE OR REPLACE FUNCTION get_service_role_key()
RETURNS TEXT AS $$
BEGIN
  RETURN 'YOUR-ACTUAL-SERVICE-ROLE-KEY';
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;
*/

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION notify_contact_submission() IS 'Triggers email notifications when a contact form is submitted';
COMMENT ON FUNCTION notify_form_submission() IS 'Triggers email notifications when a service form is submitted';
COMMENT ON FUNCTION get_function_url(TEXT) IS 'Helper function to construct Edge Function URLs';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these queries to verify triggers are set up correctly:
-- SELECT * FROM pg_trigger WHERE tgname LIKE '%contact%' OR tgname LIKE '%form%';
-- SELECT proname, prosrc FROM pg_proc WHERE proname LIKE '%notify%';
