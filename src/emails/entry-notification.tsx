import * as React from 'react'
import { Text, Section, Hr } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import type { Entry, Client, Supplier, Carrier, PackageType, EntryAttachment } from '@/lib/types'

interface EntryNotificationProps {
  entry: Entry & {
    clients?: Client
    suppliers?: Supplier
    carriers?: Carrier
    package_types?: PackageType
  }
  attachments?: EntryAttachment[]
  recipientType: 'client' | 'supplier' | 'internal'
  recipientName: string
}

export default function EntryNotification({
  entry,
  attachments = [],
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

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
        <Text style={sectionTitle}>Entry Information</Text>

        <Text style={detailRow}>
          <strong>Entry Number:</strong> {entry.entry_number}
        </Text>
        <Text style={detailRow}>
          <strong>Client:</strong> {entry.clients?.name || 'N/A'}
        </Text>
        <Text style={detailRow}>
          <strong>Supplier:</strong> {entry.suppliers?.name || 'N/A'}
        </Text>
        <Text style={detailRow}>
          <strong>Carrier/Freight:</strong> {entry.carriers?.name || 'N/A'}
        </Text>
        <Text style={detailRow}>
          <strong>Tracking Number:</strong> {entry.tracking_number || 'N/A'}
        </Text>

        <Hr style={hrLight} />
        <Text style={sectionTitle}>Merchandise Details</Text>

        <Text style={detailRow}>
          <strong>Description:</strong> {entry.description || 'N/A'}
        </Text>
        <Text style={detailRow}>
          <strong>Quantity:</strong> {entry.total_packages} {entry.package_types?.name || entry.package_type || 'packages'}
        </Text>
        <Text style={detailRow}>
          <strong>Weight:</strong> {entry.total_weight_lbs ? `${entry.total_weight_lbs} lbs` : 'N/A'}
        </Text>
        <Text style={detailRow}>
          <strong>Entry Date:</strong> {formatDate(entry.entry_date)}
        </Text>
        <Text style={detailRow}>
          <strong>Status:</strong> <span style={statusBadge(entry.status)}>{entry.status === 'received' || (entry.status as string) === 'recibido' ? 'Received' : 'Pending'}</span>
        </Text>

        {entry.notes && (
          <>
            <Hr style={hrLight} />
            <Text style={sectionTitle}>Notes/Comments</Text>
            <Text style={detailRow}>{entry.notes}</Text>
          </>
        )}

        {entry.is_damaged && (
          <Text style={{ ...detailRow, color: '#dc2626', marginTop: '16px' }}>
            <strong>⚠️ Package Damaged</strong>
          </Text>
        )}
      </Section>

      {attachments.length > 0 && (
        <Section style={attachmentSection}>
          <Text style={sectionTitle}>Attachments</Text>
          <Text style={detailRow}>
            This email includes {attachments.length} attachment(s). Please see the attached files.
          </Text>
        </Section>
      )}

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
        Core Logistics Team
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

const sectionTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 12px 0',
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
  backgroundColor: status === 'received' || status === 'recibido' ? '#dcfce7' : '#fef3c7',
  color: status === 'received' || status === 'recibido' ? '#166534' : '#854d0e',
})

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
}

const hrLight = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
}

const attachmentSection = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '16px 20px',
  marginBottom: '24px',
  borderLeft: '4px solid #3b82f6',
}
