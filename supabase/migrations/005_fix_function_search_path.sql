-- Fix Function Search Path Security Warnings
-- Adds explicit search_path to all functions to prevent security vulnerabilities

-- ============================================
-- UPDATE TIMESTAMP FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================
-- INCREMENT BLOG VIEWS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION increment_blog_views(post_slug TEXT)
RETURNS void AS $$
BEGIN
    UPDATE blog_posts
    SET views = views + 1
    WHERE slug = post_slug;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================
-- CONFIGURATION FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_supabase_url()
RETURNS TEXT AS $$
BEGIN
  -- TODO: Replace with your actual Supabase project URL
  RETURN 'https://YOUR-PROJECT-REF.supabase.co';
END;
$$ LANGUAGE plpgsql IMMUTABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION get_service_role_key()
RETURNS TEXT AS $$
BEGIN
  -- TODO: Replace with your actual service role key
  RETURN 'YOUR-SERVICE-ROLE-KEY';
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER
SET search_path = public;

-- ============================================
-- HELPER FUNCTION TO GET SUPABASE FUNCTION URL
-- ============================================

CREATE OR REPLACE FUNCTION get_function_url(function_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN get_supabase_url() || '/functions/v1/' || function_name;
END;
$$ LANGUAGE plpgsql IMMUTABLE
SET search_path = public;

-- ============================================
-- CONTACT SUBMISSION NOTIFICATION TRIGGER
-- ============================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions;

-- ============================================
-- FORM SUBMISSION NOTIFICATION TRIGGER
-- ============================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION update_updated_at_column() IS 'Updates the updated_at timestamp - search_path secured';
COMMENT ON FUNCTION increment_blog_views(TEXT) IS 'Increments blog post view count - search_path secured';
COMMENT ON FUNCTION get_supabase_url() IS 'Returns Supabase project URL - search_path secured';
COMMENT ON FUNCTION get_service_role_key() IS 'Returns service role key - search_path secured';
COMMENT ON FUNCTION get_function_url(TEXT) IS 'Constructs Edge Function URLs - search_path secured';
COMMENT ON FUNCTION notify_contact_submission() IS 'Triggers email notifications for contact submissions - search_path secured';
COMMENT ON FUNCTION notify_form_submission() IS 'Triggers email notifications for form submissions - search_path secured';
