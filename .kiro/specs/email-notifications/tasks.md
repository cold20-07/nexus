# Implementation Tasks: Email Notifications

## Phase 1: Setup & Configuration

### 1.1 Email Service Setup
- [ ] Create Resend account at resend.com
- [ ] Get API key from dashboard
- [ ] (Optional) Add and verify custom domain
- [ ] (Optional) Configure SPF/DKIM records
- [ ] Test API key with simple request
- [ ] Document API key in secure location

### 1.2 Database Schema
- [ ] Create `email_logs` table migration
- [ ] Create `admin_email_settings` table migration
- [ ] Add indexes for performance
- [ ] Set up RLS policies
- [ ] Insert default admin email settings
- [ ] Test migrations locally
- [ ] Deploy migrations to production

### 1.3 Environment Variables
- [ ] Add `RESEND_API_KEY` to Supabase secrets
- [ ] Add `FRONTEND_URL` to Supabase secrets
- [ ] Add `FROM_EMAIL` to Supabase secrets
- [ ] Add `REPLY_TO_EMAIL` to Supabase secrets
- [ ] Add `ADMIN_EMAIL` to Supabase secrets
- [ ] Update `.env.example` with new variables
- [ ] Document environment setup

## Phase 2: Supabase Edge Functions

### 2.1 Base Email Function
- [ ] Initialize Supabase Edge Functions (if not already)
- [ ] Create `send-email` function
- [ ] Install Resend package
- [ ] Implement email sending logic
- [ ] Add HTML to plain text conversion
- [ ] Add error handling
- [ ] Test function locally with Supabase CLI
- [ ] Deploy function to Supabase

### 2.2 Contact Notification Function
- [ ] Create `notify-contact-submission` function
- [ ] Implement user confirmation email logic
- [ ] Implement admin notification email logic
- [ ] Add email logging
- [ ] Add error handling
- [ ] Test function locally
- [ ] Deploy function to Supabase

### 2.3 Form Submission Notification Function
- [ ] Create `notify-form-submission` function
- [ ] Implement user confirmation email logic
- [ ] Implement admin notification email logic
- [ ] Handle different form types
- [ ] Add email logging
- [ ] Add error handling
- [ ] Test function locally
- [ ] Deploy function to Supabase

### 2.4 File Upload Notification Function
- [ ] Create `notify-file-upload` function
- [ ] Implement user confirmation email logic
- [ ] Implement admin notification email logic
- [ ] Add email logging
- [ ] Add error handling
- [ ] Test function locally
- [ ] Deploy function to Supabase

## Phase 3: Email Templates

### 3.1 User Confirmation Templates
- [ ] Design HTML template for contact confirmation
- [ ] Design HTML template for form submission confirmation
- [ ] Design HTML template for file upload confirmation
- [ ] Add company branding (logo, colors)
- [ ] Make templates mobile-responsive
- [ ] Add plain text fallbacks
- [ ] Test in major email clients

### 3.2 Admin Notification Templates
- [ ] Design HTML template for new contact notification
- [ ] Design HTML template for new form submission notification
- [ ] Design HTML template for new file upload notification
- [ ] Add admin panel links
- [ ] Make templates mobile-responsive
- [ ] Add plain text fallbacks
- [ ] Test in major email clients

### 3.3 Template Variables
- [ ] Implement template variable replacement
- [ ] Add support for {{name}}
- [ ] Add support for {{email}}
- [ ] Add support for {{referenceNumber}}
- [ ] Add support for {{formType}}
- [ ] Add support for {{submissionDate}}
- [ ] Add support for {{adminLink}}
- [ ] Test variable replacement

## Phase 4: Database Triggers

### 4.1 Contact Form Trigger
- [ ] Create `notify_contact_submission()` function
- [ ] Implement HTTP POST to Edge Function
- [ ] Create trigger on contacts table
- [ ] Test trigger with insert
- [ ] Verify email is sent
- [ ] Deploy to production

### 4.2 Form Submission Trigger
- [ ] Create `notify_form_submission()` function
- [ ] Implement HTTP POST to Edge Function
- [ ] Create trigger on form_submissions table
- [ ] Test trigger with insert
- [ ] Verify email is sent
- [ ] Deploy to production

### 4.3 File Upload Trigger
- [ ] Create `notify_file_upload()` function
- [ ] Implement HTTP POST to Edge Function
- [ ] Create trigger on file_uploads table
- [ ] Test trigger with insert
- [ ] Verify email is sent
- [ ] Deploy to production

## Phase 5: Error Handling & Logging

### 5.1 Retry Logic
- [ ] Implement retry logic in send-email function
- [ ] Add exponential backoff
- [ ] Set max retry attempts (3)
- [ ] Log retry attempts
- [ ] Test retry logic with failures

### 5.2 Email Logging
- [ ] Log all email attempts to email_logs table
- [ ] Log successful sends
- [ ] Log failed sends with error messages
- [ ] Log retry attempts
- [ ] Add timestamps for tracking

### 5.3 Error Monitoring
- [ ] Set up error logging in Edge Functions
- [ ] Add console.error for debugging
- [ ] Create alert for high failure rate
- [ ] Document common errors and solutions

## Phase 6: Admin Panel Integration

### 6.1 Email Logs View
- [ ] Create EmailLogs page in admin panel
- [ ] Display email_logs table data
- [ ] Add filters (status, type, date)
- [ ] Add search functionality
- [ ] Show email details in modal
- [ ] Add pagination
- [ ] Test admin view

### 6.2 Email Settings Page
- [ ] Create EmailSettings page in admin panel
- [ ] Display admin_email_settings
- [ ] Allow editing notification preferences
- [ ] Add toggle for each notification type
- [ ] Add save functionality
- [ ] Test settings updates

### 6.3 Navigation Updates
- [ ] Add "Email Logs" to admin navigation
- [ ] Add "Email Settings" to admin navigation
- [ ] Add icons for menu items
- [ ] Test navigation

## Phase 7: Testing

### 7.1 Unit Testing
- [ ] Test email template generation
- [ ] Test variable replacement
- [ ] Test HTML to plain text conversion
- [ ] Test error handling
- [ ] Test retry logic

### 7.2 Integration Testing
- [ ] Test contact form submission → email
- [ ] Test form submission → email
- [ ] Test file upload → email
- [ ] Test admin notification delivery
- [ ] Test user confirmation delivery
- [ ] Test with invalid email addresses
- [ ] Test with email service downtime

### 7.3 Email Client Testing
- [ ] Test in Gmail (web)
- [ ] Test in Gmail (mobile)
- [ ] Test in Outlook (web)
- [ ] Test in Outlook (desktop)
- [ ] Test in Apple Mail (iOS)
- [ ] Test in Apple Mail (macOS)
- [ ] Test in Yahoo Mail
- [ ] Check spam folders

### 7.4 Load Testing
- [ ] Test with multiple simultaneous submissions
- [ ] Test rate limiting
- [ ] Test with large email content
- [ ] Monitor performance
- [ ] Verify no blocking of form submissions

## Phase 8: Documentation

### 8.1 Technical Documentation
- [ ] Document Edge Functions
- [ ] Document database schema
- [ ] Document email templates
- [ ] Document environment variables
- [ ] Document deployment process

### 8.2 User Documentation
- [ ] Document email notification types
- [ ] Document admin email settings
- [ ] Create troubleshooting guide
- [ ] Document common issues

### 8.3 Runbook
- [ ] Document how to check email logs
- [ ] Document how to resend failed emails
- [ ] Document how to update email templates
- [ ] Document how to add new admin emails
- [ ] Document monitoring procedures

## Phase 9: Deployment

### 9.1 Pre-Deployment
- [ ] Review all code changes
- [ ] Test in staging environment
- [ ] Verify environment variables
- [ ] Backup database
- [ ] Create rollback plan

### 9.2 Deployment Steps
- [ ] Deploy database migrations
- [ ] Deploy Edge Functions
- [ ] Create database triggers
- [ ] Verify Edge Functions are running
- [ ] Test email delivery
- [ ] Monitor for errors

### 9.3 Post-Deployment
- [ ] Submit test form and verify emails
- [ ] Check email logs
- [ ] Monitor error rates
- [ ] Verify admin notifications
- [ ] Verify user confirmations

## Phase 10: Monitoring & Optimization

### 10.1 Monitoring Setup
- [ ] Set up email delivery monitoring
- [ ] Track email open rates (optional)
- [ ] Monitor failure rates
- [ ] Set up alerts for high failure rate
- [ ] Create dashboard for email metrics

### 10.2 Performance Optimization
- [ ] Optimize email template size
- [ ] Optimize Edge Function performance
- [ ] Add caching where appropriate
- [ ] Monitor and optimize database queries

### 10.3 Continuous Improvement
- [ ] Gather user feedback
- [ ] Analyze email metrics
- [ ] Improve email templates based on feedback
- [ ] Add new notification types as needed
- [ ] Update documentation

## Estimated Timeline

- **Phase 1:** 0.5 days (Setup)
- **Phase 2:** 1.5 days (Edge Functions)
- **Phase 3:** 1 day (Templates)
- **Phase 4:** 0.5 days (Triggers)
- **Phase 5:** 0.5 days (Error Handling)
- **Phase 6:** 1 day (Admin Panel)
- **Phase 7:** 1 day (Testing)
- **Phase 8:** 0.5 days (Documentation)
- **Phase 9:** 0.5 days (Deployment)
- **Phase 10:** 0.5 days (Monitoring)

**Total: 7-8 days**

## Dependencies

- Resend account with API key
- Supabase project with Edge Functions enabled
- Admin email addresses
- (Optional) Custom domain for email sending

## Success Criteria

- [ ] Users receive confirmation emails within 1 minute
- [ ] Admins receive notification emails within 1 minute
- [ ] Email delivery rate > 99%
- [ ] Emails render correctly in major email clients
- [ ] Email sending doesn't block form submissions
- [ ] Failed emails are logged and can be retried
- [ ] Admin can configure email preferences
- [ ] Email logs are accessible in admin panel

## Rollback Plan

If issues occur:
1. Disable database triggers
2. Revert Edge Function deployments
3. Revert database migrations (if needed)
4. Investigate and fix issues
5. Re-deploy with fixes

## Notes

- Start with test email addresses
- Use Resend test mode initially
- Monitor closely after deployment
- Be ready to disable if issues occur
- Keep admin informed of any issues
