import * as React from 'react'
import { Section, Heading } from '@react-email/components'

export default function EmailHeader() {
  return (
    <Section style={header}>
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
