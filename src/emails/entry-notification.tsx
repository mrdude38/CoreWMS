import * as React from 'react'
import { Text, Section, Hr } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import type { Entry, Client, Supplier, Carrier } from '@/lib/types'

interface EntryNotificationProps {
  entry: Entry & {
    clients?: Client
    suppliers?: Supplier
    carriers?: Carrier
  }
  recipientType: 'client' | 'supplier' | 'internal'
  recipientName: string
}

export default function EntryNotification({
  entry,
  recipientType,
  recipientName,
}: EntryNotificationProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const entryUrl = `${appUrl}/operations/entries/${entry.id}`

  const greeting = recipientType === 'internal'
    ? `Hello ${recipientName},`
    : `Dear ${recipientName},`

  const message = recipientType === 'client'
    ? 'A new entry has been created for your account.'
    : recipientType === 'supplier'
    ? 'A new entry has been logged for a shipment from your company.'
    : 'A new warehouse entry has been created in the system.'

  return (
    <EmailLayout previewText={`New Entry: ${entry.entry_number}`}>
      <Text style={heading}>New Entry Notification</Text>

      <Text style={paragraph}>
        {greeting}
      </Text>

      <Text style={paragraph}>
        {message}
      </Text>

      <Section style={details}>
        <Text style={detailRow}>
          <strong>Entry Number:</strong> {entry.entry_number}
        </Text>
        <Text style={detailRow}>
          <strong>Client:</strong> {entry.clients?.name || 'N/A'}
        </Text>
        <Text style={detailRow}>
          <strong>Supplier:</strong> {entry.suppliers?.name || 'N/A'}
        </Text>
        {entry.carriers && (
          <Text style={detailRow}>
            <strong>Carrier:</strong> {entry.carriers.name}
          </Text>
        )}
        <Text style={detailRow}>
          <strong>Total Packages:</strong> {entry.total_packages}
        </Text>
        <Text style={detailRow}>
          <strong>Status:</strong> <span style={statusBadge(entry.status)}>{entry.status === 'received' ? 'Received' : 'Pending'}</span>
        </Text>
        <Text style={detailRow}>
          <strong>Entry Date:</strong> {new Date(entry.entry_date).toLocaleDateString()}
        </Text>
        {entry.notes && (
          <Text style={detailRow}>
            <strong>Notes:</strong> {entry.notes}
          </Text>
        )}
        {entry.is_damaged && (
          <Text style={{ ...detailRow, color: '#dc2626' }}>
            <strong>⚠️ Package Damaged</strong>
          </Text>
        )}
      </Section>

      {recipientType === 'internal' && (
        <>
          <Hr style={hr} />
          <EmailButton href={entryUrl}>
            View Entry Details
          </EmailButton>
        </>
      )}

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

const statusBadge = (status: string) => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
  backgroundColor: status === 'received' ? '#dcfce7' : '#fef3c7',
  color: status === 'received' ? '#166534' : '#854d0e',
})

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
}
