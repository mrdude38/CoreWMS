import * as React from 'react'
import { Text, Section, Hr } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import type { LoadOrder, Client, Carrier } from '@/lib/types'

interface LoadOrderNotificationProps {
  loadOrder: LoadOrder & {
    clients?: Client
    carriers?: Carrier
  }
  entries: Array<{
    entry_number: string
    packages_quantity: number
  }>
  recipientType: 'client' | 'carrier' | 'internal'
  recipientName: string
}

export default function LoadOrderNotification({
  loadOrder,
  entries,
  recipientType,
  recipientName,
}: LoadOrderNotificationProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const loadOrderUrl = `${appUrl}/operations/load-orders/${loadOrder.id}`

  const greeting = recipientType === 'internal'
    ? `Hello ${recipientName},`
    : `Dear ${recipientName},`

  const message = recipientType === 'client'
    ? 'A new load order has been created for your shipment.'
    : recipientType === 'carrier'
    ? 'A new load order has been assigned to your company.'
    : 'A new load order has been created in the system.'

  return (
    <EmailLayout previewText={`New Load Order: ${loadOrder.order_number}`}>
      <Text style={heading}>New Load Order</Text>

      <Text style={paragraph}>
        {greeting}
      </Text>

      <Text style={paragraph}>
        {message}
      </Text>

      <Section style={details}>
        <Text style={detailRow}>
          <strong>Order Number:</strong> {loadOrder.order_number}
        </Text>
        <Text style={detailRow}>
          <strong>Client:</strong> {loadOrder.clients?.name || 'N/A'}
        </Text>
        <Text style={detailRow}>
          <strong>Carrier:</strong> {loadOrder.carriers?.name || 'N/A'}
        </Text>
        <Text style={detailRow}>
          <strong>Total Packages:</strong> {loadOrder.total_packages}
        </Text>
        <Text style={detailRow}>
          <strong>Status:</strong> <span style={statusBadge(loadOrder.status)}>{loadOrder.status}</span>
        </Text>
        {loadOrder.load_date && (
          <Text style={detailRow}>
            <strong>Load Date:</strong> {new Date(loadOrder.load_date).toLocaleDateString()}
          </Text>
        )}
        {loadOrder.destination && (
          <Text style={detailRow}>
            <strong>Destination:</strong> {loadOrder.destination}
          </Text>
        )}
      </Section>

      {entries.length > 0 && (
        <>
          <Text style={subheading}>Included Entries:</Text>
          <Section style={entriesSection}>
            {entries.map((entry, index) => (
              <Text key={index} style={entryRow}>
                • {entry.entry_number} - {entry.packages_quantity} packages
              </Text>
            ))}
          </Section>
        </>
      )}

      {recipientType === 'internal' && (
        <>
          <Hr style={hr} />
          <EmailButton href={loadOrderUrl}>
            View Load Order Details
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

const subheading = {
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '12px',
  marginTop: '24px',
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

const entriesSection = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
}

const entryRow = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#374151',
  margin: '4px 0',
}

const statusBadge = (status: string) => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'capitalize' as const,
  backgroundColor: status === 'completed' ? '#dcfce7' : '#dbeafe',
  color: status === 'completed' ? '#166534' : '#1e40af',
})

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
}
