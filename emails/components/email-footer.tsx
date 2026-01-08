import * as React from 'react'
import { Section, Text, Hr, Link } from '@react-email/components'

export default function EmailFooter() {
  return (
    <Section style={footer}>
      <Hr style={hr} />
      <Text style={footerText}>
        CoreWMS - Warehouse Management System
      </Text>
      <Text style={footerText}>
        <Link href={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'} style={link}>
          Login to Dashboard
        </Link>
        {' | '}
        <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/profile/email-preferences`} style={link}>
          Email Preferences
        </Link>
      </Text>
      <Text style={footerSmall}>
        This is an automated notification from CoreWMS. Please do not reply to this email.
      </Text>
    </Section>
  )
}

const footer = {
  padding: '0 48px',
  marginTop: '32px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const footerText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '16px',
  margin: '8px 0',
  textAlign: 'center' as const,
}

const footerSmall = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 0 0',
  textAlign: 'center' as const,
}

const link = {
  color: '#2563eb',
  textDecoration: 'none',
}
