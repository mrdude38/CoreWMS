import * as React from 'react'
import { Text } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'

interface PasswordResetProps {
  resetUrl: string
}

export default function PasswordReset({
  resetUrl,
}: PasswordResetProps) {
  return (
    <EmailLayout previewText="Reset your CoreWMS password">
      <Text style={heading}>Reset Your Password</Text>

      <Text style={paragraph}>
        You recently requested to reset your password for your CoreWMS account.
      </Text>

      <Text style={paragraph}>
        Click the button below to reset your password. This link will expire in 1 hour.
      </Text>

      <EmailButton href={resetUrl}>
        Reset Password
      </EmailButton>

      <Text style={paragraph}>
        If you didn't request a password reset, you can safely ignore this email.
      </Text>

      <Text style={paragraph}>
        Thank you,<br />
        CoreWMS Team
      </Text>
    </EmailLayout>
  )
}

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '24px',
  color: '#1f2937',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  marginBottom: '16px',
}
