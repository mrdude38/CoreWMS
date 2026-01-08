import * as React from 'react'
import { Html, Head, Body, Container, Section, Preview } from '@react-email/components'
import EmailHeader from './email-header'
import EmailFooter from './email-footer'

interface EmailLayoutProps {
  children: React.ReactNode
  previewText?: string
}

export default function EmailLayout({ children, previewText }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={main}>
        <Container style={container}>
          <EmailHeader />
          <Section style={content}>
            {children}
          </Section>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const content = {
  padding: '0 48px',
}
