import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'

serve(async (req) => {
  try {
    const { record } = await req.json()
    
    if (!record) {
      throw new Error('No record provided')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Send user confirmation email
    await sendUserConfirmation(supabase, record)
    
    // Send admin notification email
    await sendAdminNotification(supabase, record)
    
    return new Response(
      JSON.stringify({ success: true, message: 'Notifications sent' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

async function sendUserConfirmation(supabase: any, submission: any) {
  try {
    const html = generateUserConfirmationEmail(submission)
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: submission.email,
        subject: `Form Submission Received - ${getFormTypeLabel(submission.form_type)}`,
        html,
      },
    })

    if (error) throw error

    await supabase.from('email_logs').insert({
      form_submission_id: submission.id,
      recipient_email: submission.email,
      recipient_name: submission.full_name,
      email_type: 'user_confirmation',
      subject: `Form Submission Received - ${getFormTypeLabel(submission.form_type)}`,
      status: 'sent',
      email_service_id: data?.id,
      sent_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error sending user confirmation:', error)
    
    await supabase.from('email_logs').insert({
      form_submission_id: submission.id,
      recipient_email: submission.email,
      recipient_name: submission.full_name,
      email_type: 'user_confirmation',
      subject: `Form Submission Received - ${getFormTypeLabel(submission.form_type)}`,
      status: 'failed',
      error_message: error.message,
      failed_at: new Date().toISOString(),
    })
  }
}

async function sendAdminNotification(supabase: any, submission: any) {
  try {
    const { data: admins, error: adminError } = await supabase
      .from('admin_email_settings')
      .select('admin_email')
      .eq('notify_new_form_submission', true)
      .eq('is_active', true)

    if (adminError) throw adminError
    if (!admins || admins.length === 0) {
      console.log('No active admins to notify')
      return
    }

    const html = generateAdminNotificationEmail(submission)
    
    for (const admin of admins) {
      try {
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            to: admin.admin_email,
            subject: `New ${getFormTypeLabel(submission.form_type)} Submission from ${submission.full_name}`,
            html,
          },
        })

        if (error) throw error

        await supabase.from('email_logs').insert({
          form_submission_id: submission.id,
          recipient_email: admin.admin_email,
          email_type: 'admin_notification',
          subject: `New ${getFormTypeLabel(submission.form_type)} Submission from ${submission.full_name}`,
          status: 'sent',
          email_service_id: data?.id,
          sent_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error(`Error sending to admin ${admin.admin_email}:`, error)
        
        await supabase.from('email_logs').insert({
          form_submission_id: submission.id,
          recipient_email: admin.admin_email,
          email_type: 'admin_notification',
          subject: `New ${getFormTypeLabel(submission.form_type)} Submission from ${submission.full_name}`,
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString(),
        })
      }
    }
  } catch (error) {
    console.error('Error sending admin notifications:', error)
  }
}

function getFormTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'quick_intake': 'Quick Intake',
    'aid_attendance': 'Aid & Attendance',
    'nexus_letter': 'Nexus Letter',
    'dbq': 'DBQ',
    '1151_claim': '1151 Claim',
    'unsure': 'General Inquiry',
  }
  return labels[type] || type
}

function generateUserConfirmationEmail(submission: any): string {
  const referenceNumber = submission.id.substring(0, 8).toUpperCase()
  const formTypeLabel = getFormTypeLabel(submission.form_type)
  const submittedDate = new Date(submission.created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Form Submission Received</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Military Disability Nexus</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-top: 0;">Form Submission Received</h2>
        
        <p>Dear ${submission.full_name},</p>
        
        <p>Thank you for submitting your <strong>${formTypeLabel}</strong> form. We have received your information and our medical team will begin reviewing your case.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea; font-size: 18px;">Submission Details</h3>
          <p style="margin: 8px 0;"><strong>Reference Number:</strong> ${referenceNumber}</p>
          <p style="margin: 8px 0;"><strong>Form Type:</strong> ${formTypeLabel}</p>
          <p style="margin: 8px 0;"><strong>Submitted:</strong> ${submittedDate}</p>
        </div>
        
        <h3 style="color: #1f2937; font-size: 18px;">What Happens Next?</h3>
        <ul style="padding-left: 20px; line-height: 1.8;">
          <li>Our medical team will review your submission within 24-48 hours</li>
          <li>We may contact you if additional information is needed</li>
          <li>Processing time: 7-10 business days (or 36-48 hours for rush service)</li>
          <li>You'll receive updates via email as we progress</li>
        </ul>
        
        ${submission.requires_upload ? `
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;"><strong>⚠️ Action Required:</strong> Please upload your supporting documents as soon as possible to avoid delays in processing.</p>
        </div>
        ` : ''}
        
        <p style="margin-top: 30px;">If you have any questions, please contact us at <a href="mailto:contact@militarydisabilitynexus.com" style="color: #667eea; text-decoration: none;">contact@militarydisabilitynexus.com</a></p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 5px 0;"><strong>Military Disability Nexus</strong></p>
          <p style="margin: 5px 0;">Professional Medical Documentation for VA Claims</p>
          <p style="margin: 15px 0;">
            <a href="https://militarydisabilitynexus.com" style="color: #667eea; text-decoration: none; margin: 0 10px;">Website</a> |
            <a href="mailto:contact@militarydisabilitynexus.com" style="color: #667eea; text-decoration: none; margin: 0 10px;">Email</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateAdminNotificationEmail(submission: any): string {
  const adminUrl = `${frontendUrl}/admin/form-submissions`
  const referenceNumber = submission.id.substring(0, 8).toUpperCase()
  const formTypeLabel = getFormTypeLabel(submission.form_type)
  const submittedDate = new Date(submission.created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Form Submission</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: #1f2937; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0; font-size: 22px;">📋 New ${formTypeLabel} Submission</h2>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">Submission Information</h3>
          <p style="margin: 8px 0;"><strong>Name:</strong> ${submission.full_name}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${submission.email}" style="color: #667eea;">${submission.email}</a></p>
          ${submission.phone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${submission.phone}</p>` : ''}
          <p style="margin: 8px 0;"><strong>Form Type:</strong> ${formTypeLabel}</p>
          <p style="margin: 8px 0;"><strong>Requires Upload:</strong> ${submission.requires_upload ? 'Yes' : 'No'}</p>
        </div>
        
        ${submission.form_data && Object.keys(submission.form_data).length > 0 ? `
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">Form Data Summary</h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">View full details in the admin panel</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${adminUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Admin Panel</a>
        </div>
        
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px; text-align: center;">
          Submitted: ${submittedDate}<br>
          Reference: ${referenceNumber}
        </p>
      </div>
    </body>
    </html>
  `
}
