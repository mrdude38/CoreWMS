import { Resend } from 'resend'

// Initialize Resend client - will be null if API key is not set
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null as unknown as Resend

export const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || 'notifications@corewms.com',
  fromName: process.env.RESEND_FROM_NAME || 'CoreWMS',
  enabled: process.env.EMAIL_ENABLED !== 'false',
  bccAdmin: process.env.EMAIL_BCC_ADMIN,
}
