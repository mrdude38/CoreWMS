import type { EmailTemplate } from '@/lib/types'

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  template: EmailTemplate
  data: Record<string, any>
  bcc?: string[]
  replyTo?: string
  attachments?: EmailAttachment[]
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}
