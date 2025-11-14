# Email Notifications - Technical Design

## Architecture Overview

```
┌─────────────────┐
│   Form Submit   │
│   (Frontend)    │
└────────┬────────┘
         │
         │ 1. Submit Form
         ▼
┌─────────────────┐
│  Supabase DB    │
│  (Insert Data)  │
└────────┬────────┘
         │
         │ 2. Trigger Edge Function
         ▼
┌─────────────────┐
│ Send Email      │
│ Edge Function   │
└────────┬────────┘
         │
         │ 3. Call Email API
         ▼
┌─────────────────┐
│  Resend API     │
│  (Send Email)   │
└────────┬────────┘
         │
         │ 4. Deliver Email
         ▼
┌─────────────────┐
│  User/Admin     │
│  Email Inbox    │
└─────────────────┘
```

## Technology Stack

### Email Service: Resend
**Why Resend?**
- Modern, developer-friendly API
- React Email support (optional)
- 100 emails/day free tier
- Good deliverability
- Simple setup
- Great documentation

**Alternatives:**
- SendGrid (more features, similar pricing)
- AWS SES (cheapest for high volume)
- Postmark (excellent deliverability)

### Backend: Supabase Edge Functions
- Serverless functions for email sending
- Triggered after form submission
- Async processing (non-blocking)
- Built-in retry logic

### Templates: HTML + Plain Text
- Responsive HTML templates
- Plain text fallback
- Inline CSS for compatibility
- Mobile-first design

## Database Schema

### Email Logs Table

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  form_submission_id UUID REFERENCES form_submissions(id) ON DELETE SET NULL,
  
  -- Email Details
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  email_type TEXT NOT NULL, -- 'user_confirmation', 'admin_notification', 'file_upload_confirmation'
  subject TEXT NOT NULL,
  
  -- Sending Details
  email_service TEXT DEFAULT 'resend', -- 'resend', 'sendgrid', 'ses'
  email_service_id TEXT, -- ID from email service (for tracking)
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
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

-- Indexes
CREATE INDEX idx_email_logs_contact ON email_logs(contact_id);
CREATE INDEX idx_email_logs_form_submission ON email_logs(form_submission_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);

-- RLS Policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all email logs
CREATE POLICY "Admins can view all email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        SELECT email FROM admin_users WHERE is_active = true
      )
    )
  );

-- Service role can manage email logs
CREATE POLICY "Service role can manage email logs"
  ON email_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Admin Email Settings Table

```sql
CREATE TABLE admin_email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_email TEXT UNIQUE NOT NULL,
  
  -- Notification Preferences
  notify_new_contact BOOLEAN DEFAULT true,
  notify_new_form_submission BOOLEAN DEFAULT true,
  notify_new_file_upload BOOLEAN DEFAULT true,
  
  -- Delivery Preferences
  notification_frequency TEXT DEFAULT 'immediate', -- 'immediate', 'hourly', 'daily'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin settings
INSERT INTO admin_email_settings (admin_email) 
VALUES ('admin@militarydisabilitynexus.com')
ON CONFLICT (admin_email) DO NOTHING;
```

## Supabase Edge Functions

### 1. Send Email Function

**File:** `supabase/functions/send-email/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

serve(async (req) => {
  try {
    const { to, subject, html, text, from, replyTo }: EmailRequest = await req.json();

    const data = await resend.emails.send({
      from: from || 'Military Disability Nexus <noreply@militarydisabilitynexus.com>',
      to: [to],
      subject,
      html,
      text: text || stripHtml(html),
      replyTo: replyTo || 'contact@militarydisabilitynexus.com',
    });

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
```

### 2. Contact Form Notification Function

**File:** `supabase/functions/notify-contact-submission/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  try {
    const { record } = await req.json();
    
    // Send user confirmation
    await sendUserConfirmation(record);
    
    // Send admin notification
    await sendAdminNotification(record);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Notification error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function sendUserConfirmation(contact: any) {
  const html = generateUserConfirmationEmail(contact);
  
  await supabase.functions.invoke('send-email', {
    body: {
      to: contact.email,
      subject: 'Thank you for contacting Military Disability Nexus',
      html,
    },
  });
  
  // Log email
  await supabase.from('email_logs').insert({
    contact_id: contact.id,
    recipient_email: contact.email,
    recipient_name: contact.name,
    email_type: 'user_confirmation',
    subject: 'Thank you for contacting Military Disability Nexus',
    status: 'sent',
    sent_at: new Date().toISOString(),
  });
}

async function sendAdminNotification(contact: any) {
  // Get admin emails
  const { data: admins } = await supabase
    .from('admin_email_settings')
    .select('admin_email')
    .eq('notify_new_contact', true)
    .eq('is_active', true);
  
  if (!admins || admins.length === 0) return;
  
  const html = generateAdminNotificationEmail(contact);
  
  for (const admin of admins) {
    await supabase.functions.invoke('send-email', {
      body: {
        to: admin.admin_email,
        subject: `New Contact Form Submission from ${contact.name}`,
        html,
      },
    });
    
    // Log email
    await supabase.from('email_logs').insert({
      contact_id: contact.id,
      recipient_email: admin.admin_email,
      email_type: 'admin_notification',
      subject: `New Contact Form Submission from ${contact.name}`,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });
  }
}

function generateUserConfirmationEmail(contact: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Military Disability Nexus</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Thank You for Contacting Us</h2>
        
        <p>Dear ${contact.name},</p>
        
        <p>We have received your inquiry and appreciate you reaching out to Military Disability Nexus.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">Your Submission Details</h3>
          <p><strong>Reference Number:</strong> ${contact.id.substring(0, 8).toUpperCase()}</p>
          <p><strong>Subject:</strong> ${contact.subject}</p>
          <p><strong>Submitted:</strong> ${new Date(contact.created_at).toLocaleString()}</p>
        </div>
        
        <h3 style="color: #1f2937;">What Happens Next?</h3>
        <ul style="padding-left: 20px;">
          <li>Our team will review your inquiry within 24-48 hours</li>
          <li>A specialist will reach out to discuss your needs</li>
          <li>We'll provide guidance on the best path forward</li>
        </ul>
        
        <p>If you have any urgent questions, please don't hesitate to contact us at <a href="mailto:contact@militarydisabilitynexus.com" style="color: #667eea;">contact@militarydisabilitynexus.com</a></p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>Military Disability Nexus<br>
          Professional Medical Documentation for VA Claims</p>
          <p>
            <a href="https://militarydisabilitynexus.com" style="color: #667eea; text-decoration: none;">Website</a> |
            <a href="mailto:contact@militarydisabilitynexus.com" style="color: #667eea; text-decoration: none;">Email</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateAdminNotificationEmail(contact: any): string {
  const adminUrl = `${Deno.env.get('FRONTEND_URL')}/admin/contacts`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Submission</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1f2937; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">🔔 New Contact Form Submission</h2>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #1f2937;">Contact Information</h3>
          <p><strong>Name:</strong> ${contact.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
          ${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ''}
          <p><strong>Subject:</strong> ${contact.subject}</p>
          ${contact.service_interest ? `<p><strong>Service Interest:</strong> ${contact.service_interest}</p>` : ''}
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #1f2937;">Message</h3>
          <p style="white-space: pre-wrap;">${contact.message}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${adminUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Admin Panel</a>
        </div>
        
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px; text-align: center;">
          Submitted: ${new Date(contact.created_at).toLocaleString()}<br>
          Reference: ${contact.id.substring(0, 8).toUpperCase()}
        </p>
      </div>
    </body>
    </html>
  `;
}
```

## Database Triggers

### Trigger on Contact Insert

```sql
-- Create function to notify on contact insert
CREATE OR REPLACE FUNCTION notify_contact_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function asynchronously
  PERFORM net.http_post(
    url := current_setting('app.supabase_functions_url') || '/notify-contact-submission',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_contact_insert
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION notify_contact_submission();
```

### Trigger on Form Submission Insert

```sql
-- Create function to notify on form submission
CREATE OR REPLACE FUNCTION notify_form_submission()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.supabase_functions_url') || '/notify-form-submission',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_form_submission_insert
  AFTER INSERT ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_form_submission();
```

## Email Templates

### Template Structure

```
supabase/functions/email-templates/
├── user-confirmation.ts
├── admin-notification.ts
├── form-submission-confirmation.ts
└── file-upload-confirmation.ts
```

### Styling Guidelines

- Use inline CSS for email client compatibility
- Mobile-first responsive design
- Maximum width: 600px
- Use web-safe fonts (Arial, Helvetica, sans-serif)
- Test in major email clients (Gmail, Outlook, Apple Mail)

## Environment Variables

```bash
# Resend API Key
RESEND_API_KEY=re_...

# Supabase (for Edge Functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Frontend URL (for admin links)
FRONTEND_URL=https://militarydisabilitynexus.com

# Email Settings
FROM_EMAIL=noreply@militarydisabilitynexus.com
REPLY_TO_EMAIL=contact@militarydisabilitynexus.com
ADMIN_EMAIL=admin@militarydisabilitynexus.com
```

## Error Handling

### Retry Logic

```typescript
async function sendEmailWithRetry(emailData: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendEmail(emailData);
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        // Log final failure
        await logEmailFailure(emailData, error);
        throw error;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
}
```

### Logging

```typescript
async function logEmailFailure(emailData: any, error: Error) {
  await supabase.from('email_logs').insert({
    recipient_email: emailData.to,
    email_type: emailData.type,
    subject: emailData.subject,
    status: 'failed',
    error_message: error.message,
    failed_at: new Date().toISOString(),
  });
}
```

## Testing Strategy

### Local Testing
- Use Resend test mode
- Test with real email addresses
- Verify email delivery
- Check spam folders

### Email Client Testing
- Gmail (web and mobile)
- Outlook (web and desktop)
- Apple Mail (iOS and macOS)
- Yahoo Mail
- ProtonMail

### Test Scenarios
1. Successful email delivery
2. Invalid email address
3. Email service downtime
4. Rate limiting
5. Large email content
6. Special characters in content

## Monitoring

### Metrics to Track
- Email delivery rate
- Email open rate (if tracking enabled)
- Failed email count
- Average send time
- Bounce rate

### Alerts
- Failed email threshold (> 5% failure rate)
- Email service downtime
- High bounce rate
- Unusual email volume

## Security Considerations

1. **API Key Security** - Store in environment variables only
2. **Email Validation** - Validate email addresses before sending
3. **Rate Limiting** - Prevent abuse with rate limits
4. **Content Sanitization** - Sanitize user input in emails
5. **HIPAA Compliance** - Don't include PHI in emails
6. **SPF/DKIM** - Configure for better deliverability

## Deployment Checklist

- [ ] Create Resend account
- [ ] Get API key
- [ ] Configure domain (optional, for custom from address)
- [ ] Set up SPF/DKIM records
- [ ] Deploy Edge Functions
- [ ] Add environment variables
- [ ] Create database tables
- [ ] Set up triggers
- [ ] Test email delivery
- [ ] Monitor first emails
