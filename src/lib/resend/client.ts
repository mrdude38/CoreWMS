import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || 'notifications@corewms.com',
  fromName: process.env.RESEND_FROM_NAME || 'CoreWMS',
  enabled: process.env.EMAIL_ENABLED !== 'false',
  bccAdmin: process.env.EMAIL_BCC_ADMIN,
}
