import { resend, EMAIL_CONFIG } from './client'
import type { SendEmailParams, EmailResult } from './types'
import { createClient } from '@/lib/supabase/server'
import { render } from '@react-email/render'

// Template imports - will be populated as templates are created
const getTemplate = async (templateName: string) => {
  try {
    switch (templateName) {
      case 'entry-notification':
        const EntryNotification = (await import('@/emails/entry-notification')).default
        return EntryNotification
      case 'load-order-notification':
        const LoadOrderNotification = (await import('@/emails/load-order-notification')).default
        return LoadOrderNotification
      case 'user-welcome':
        const UserWelcome = (await import('@/emails/user-welcome')).default
        return UserWelcome
      // TODO: Implement these templates
      // case 'password-reset':
      //   const PasswordReset = (await import('@/emails/password-reset')).default
      //   return PasswordReset
      // case 'inventory-report':
      //   const InventoryReport = (await import('@/emails/inventory-report')).default
      //   return InventoryReport
      // case 'weekly-summary':
      //   const WeeklySummary = (await import('@/emails/weekly-summary')).default
      //   return WeeklySummary
      default:
        throw new Error(`Unknown email template: ${templateName}`)
    }
  } catch (error) {
    console.error(`Failed to load template ${templateName}:`, error)
    throw new Error(`Email template "${templateName}" not found`)
  }
}

export async function sendEmail({
  to,
  subject,
  template,
  data,
  bcc = [],
  replyTo,
}: SendEmailParams): Promise<EmailResult> {
  try {
    // Check if emails are enabled
    if (!EMAIL_CONFIG.enabled) {
      console.log('Emails disabled, skipping:', { to, subject, template })
      return { success: true, messageId: 'disabled' }
    }

    // Get template component
    const TemplateComponent = await getTemplate(template)
    if (!TemplateComponent) {
      throw new Error(`Unknown email template: ${template}`)
    }

    // Render template
    const html = await render(TemplateComponent(data as any))

    // Add admin BCC if configured
    const bccRecipients = [...bcc]
    if (EMAIL_CONFIG.bccAdmin) {
      bccRecipients.push(EMAIL_CONFIG.bccAdmin)
    }

    // Send email
    const { data: result, error } = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
      replyTo,
    })

    if (error) {
      throw error
    }

    // Log email (fire and forget)
    logEmail({
      template,
      recipientEmail: Array.isArray(to) ? to[0] : to,
      subject,
      status: 'sent',
      metadata: { messageId: result?.id, data },
    }).catch(console.error)

    return {
      success: true,
      messageId: result?.id,
    }
  } catch (error) {
    console.error('Email sending failed:', error)

    // Log failure
    logEmail({
      template,
      recipientEmail: Array.isArray(to) ? to[0] : to,
      subject,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      metadata: { data },
    }).catch(console.error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function logEmail(params: {
  template: string
  recipientEmail: string
  subject: string
  status: 'sent' | 'failed'
  errorMessage?: string
  metadata?: Record<string, any>
}) {
  try {
    const supabase = await createClient()
    await supabase.from('email_logs').insert({
      template: params.template,
      recipient_email: params.recipientEmail,
      subject: params.subject,
      status: params.status,
      error_message: params.errorMessage,
      metadata: params.metadata,
      sent_at: params.status === 'sent' ? new Date().toISOString() : null,
    })
  } catch (error) {
    console.error('Failed to log email:', error)
  }
}

// Helper function to check user preferences
export async function shouldSendNotification(
  userProfileId: string,
  notificationType: 'entry_notifications' | 'load_order_notifications' | 'report_notifications' | 'weekly_summary'
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('email_notification_preferences')
      .select(notificationType)
      .eq('user_profile_id', userProfileId)
      .single()

    // Default to true if no preferences set
    return (data as any)?.[notificationType] ?? true
  } catch {
    return true
  }
}
