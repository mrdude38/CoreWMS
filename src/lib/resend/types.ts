import type { EmailTemplate } from '@/lib/types'

export interface SendEmailParams {
  to: string | string[]
  subject: string
  template: EmailTemplate
  data: Record<string, any>
  bcc?: string[]
  replyTo?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}
