import * as React from 'react'
import { Section, Heading, Img } from '@react-email/components'

export default function EmailHeader() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wms.core-logistics.com'
  const logoUrl = `${appUrl}/logo.png`

  return (
    <Section style={header}>
      <Img
        src={logoUrl}
        alt="Core Logistics"
        width="150"
        height="50"
        style={logo}
      />
      <Heading style={heading}>CoreWMS</Heading>
      <div style={tagline}>Warehouse Management System</div>
    </Section>
  )
}

const header = {
  backgroundColor: '#2563eb',
  padding: '24px 48px',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto 12px',
  display: 'block',
}

const heading = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
}

const tagline = {
  color: '#e0e7ff',
  fontSize: '14px',
  margin: '4px 0 0',
}
