-- Email Notifications Migration
-- Creates tables for email logging and admin email settings

-- ============================================
-- EMAIL LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  form_submission_id UUID REFERENCES form_submissions(id) ON DELETE SET NULL,
  
  -- Email Details
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  email_type TEXT NOT NULL CHECK (email_type IN ('user_confirmation', 'admin_notification', 'file_upload_confirmation')),
  subject TEXT NOT NULL,
  
  -- Sending Details
  email_service TEXT DEFAULT 'resend',
  email_service_id TEXT, -- ID from email service (for tracking)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  
  -- Metadata
  template_used TEXT,
  template_variables JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0
);

-- Indexes for email_logs
CREATE INDEX idx_email_logs_contact ON email_logs(contact_id);
CREATE INDEX idx_email_logs_form_submission ON email_logs(form_submission_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX idx_email_logs_recipient_email ON email_logs(recipient_email);

-- RLS Policies for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all email logs (admins only in production)
CREATE POLICY "Authenticated users can view email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (true);

-- Service role can manage email logs (for Edge Functions)
CREATE POLICY "Service role can manage email logs"
  ON email_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ADMIN EMAIL SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS admin_email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_email TEXT UNIQUE NOT NULL,
  
  -- Notification Preferences
  notify_new_contact BOOLEAN DEFAULT true,
  notify_new_form_submission BOOLEAN DEFAULT true,
  notify_new_file_upload BOOLEAN DEFAULT true,
  
  -- Delivery Preferences
  notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'hourly', 'daily')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for admin_email_settings
CREATE INDEX idx_admin_email_settings_active ON admin_email_settings(is_active);

-- RLS Policies for admin_email_settings
ALTER TABLE admin_email_settings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view and update email settings (admins only in production)
CREATE POLICY "Authenticated users can view email settings"
  ON admin_email_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update email settings"
  ON admin_email_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role can manage admin email settings
CREATE POLICY "Service role can manage admin email settings"
  ON admin_email_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- INSERT DEFAULT ADMIN EMAIL SETTINGS
-- ============================================

-- Insert default admin email (update this with your actual admin email)
INSERT INTO admin_email_settings (admin_email, notify_new_contact, notify_new_form_submission, notify_new_file_upload)
VALUES ('admin@militarydisabilitynexus.com', true, true, true)
ON CONFLICT (admin_email) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE email_logs IS 'Logs all email sending attempts for tracking and debugging';
COMMENT ON TABLE admin_email_settings IS 'Stores admin email notification preferences';
COMMENT ON COLUMN email_logs.email_type IS 'Type of email: user_confirmation, admin_notification, or file_upload_confirmation';
COMMENT ON COLUMN email_logs.status IS 'Email delivery status: pending, sent, failed, or bounced';
COMMENT ON COLUMN admin_email_settings.notification_frequency IS 'How often to send notifications: immediate, hourly, or daily';
