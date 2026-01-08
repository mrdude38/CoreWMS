import * as React from 'react'
import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'

interface UserWelcomeProps {
  userName: string
  userEmail: string
  role: string
  loginUrl: string
}

export default function UserWelcome({
  userName,
  userEmail,
  role,
  loginUrl,
}: UserWelcomeProps) {
  return (
    <EmailLayout previewText="Welcome to CoreWMS">
      <Text style={heading}>Welcome to CoreWMS!</Text>

      <Text style={paragraph}>
        Hello {userName},
      </Text>

      <Text style={paragraph}>
        Your account has been created successfully. You now have access to the CoreWMS Warehouse Management System.
      </Text>

      <Section style={details}>
        <Text style={detailRow}>
          <strong>Email:</strong> {userEmail}
        </Text>
        <Text style={detailRow}>
          <strong>Role:</strong> <span style={roleBadge}>{role}</span>
        </Text>
      </Section>

      <EmailButton href={loginUrl}>
        Access Dashboard
      </EmailButton>

      <Text style={paragraph}>
        If you have any questions, please contact your system administrator.
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

const details = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
}

const detailRow = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#374151',
  margin: '8px 0',
}

const roleBadge = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  textTransform: 'capitalize' as const,
}
