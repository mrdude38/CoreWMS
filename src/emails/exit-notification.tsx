import * as React from 'react'
import { Text, Section, Hr } from '@react-email/components'
import EmailLayout from './components/email-layout'

interface EntryInfo {
  entry_number: string
  entry_date: string
  description?: string
  total_packages: number
  packages_in_order: number
  supplier_name?: string
  tracking_number?: string
  has_invoice: boolean
  has_revision: boolean
  revision_info?: {
    invoice_number?: string
    total_weight_kg: number
    num_bultos: number
    num_tarimas: number
    items_count: number
  }
}

interface ExitNotificationProps {
  order_number: string
  client_name: string
  carrier_name?: string
  total_packages: number
  exit_date: string
  destination?: string
  pedimento_invoice_number?: string
  economic_number?: string
  entries: EntryInfo[]
  attachments_summary: {
    entry_pdfs: number
    invoices: number
    revisions: number
    other_attachments: number
  }
}

export default function ExitNotification({
  order_number,
  client_name,
  carrier_name,
  total_packages,
  exit_date,
  destination,
  pedimento_invoice_number,
  economic_number,
  entries,
  attachments_summary,
}: ExitNotificationProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const totalAttachments =
    attachments_summary.entry_pdfs +
    attachments_summary.invoices +
    attachments_summary.revisions +
    attachments_summary.other_attachments

  return (
    <EmailLayout previewText={`Shipment Exit: ${order_number}`}>
      <Text style={heading}>Exit Notification</Text>

      <Text style={paragraph}>
        Dear Customer,
      </Text>

      <Text style={paragraph}>
        We are pleased to inform you that your merchandise has been dispatched. Below you will find the details of this shipment:
      </Text>

      {/* Order Summary */}
      <Section style={details}>
        <Text style={sectionTitle}>Exit Information</Text>

        <Text style={detailRow}>
          <strong>Order Number:</strong> {order_number}
        </Text>
        <Text style={detailRow}>
          <strong>Client:</strong> {client_name}
        </Text>
        {carrier_name && (
          <Text style={detailRow}>
            <strong>Carrier:</strong> {carrier_name}
          </Text>
        )}
        <Text style={detailRow}>
          <strong>Exit Date:</strong> {formatDate(exit_date)}
        </Text>
        {destination && (
          <Text style={detailRow}>
            <strong>Destination:</strong> {destination}
          </Text>
        )}
        {pedimento_invoice_number && (
          <Text style={detailRow}>
            <strong>Customs Entry/Invoice:</strong> {pedimento_invoice_number}
          </Text>
        )}
        {economic_number && (
          <Text style={detailRow}>
            <strong>Economic Number:</strong> {economic_number}
          </Text>
        )}
        <Text style={detailRow}>
          <strong>Total Packages:</strong> {total_packages}
        </Text>
      </Section>

      {/* Entries Detail */}
      {entries.length > 0 && (
        <>
          <Text style={subheading}>Included Entries ({entries.length})</Text>

          {entries.map((entry, index) => (
            <Section key={index} style={entryCard}>
              <Text style={entryTitle}>{entry.entry_number}</Text>

              <Text style={entryDetail}>
                <strong>Entry Date:</strong> {formatDate(entry.entry_date)}
              </Text>
              {entry.supplier_name && (
                <Text style={entryDetail}>
                  <strong>Supplier:</strong> {entry.supplier_name}
                </Text>
              )}
              {entry.tracking_number && (
                <Text style={entryDetail}>
                  <strong>Tracking:</strong> {entry.tracking_number}
                </Text>
              )}
              {entry.description && (
                <Text style={entryDetail}>
                  <strong>Description:</strong> {entry.description}
                </Text>
              )}
              <Text style={entryDetail}>
                <strong>Packages in Order:</strong> {entry.packages_in_order} of {entry.total_packages}
              </Text>

              {/* Revision Info */}
              {entry.has_revision && entry.revision_info && (
                <Section style={revisionBox}>
                  <Text style={revisionTitle}>Revision</Text>
                  {entry.revision_info.invoice_number && (
                    <Text style={revisionDetail}>
                      Invoice: {entry.revision_info.invoice_number}
                    </Text>
                  )}
                  <Text style={revisionDetail}>
                    Total Weight: {entry.revision_info.total_weight_kg.toFixed(2)} KG
                  </Text>
                  <Text style={revisionDetail}>
                    Packages: {entry.revision_info.num_bultos} | Pallets: {entry.revision_info.num_tarimas}
                  </Text>
                  <Text style={revisionDetail}>
                    Line Items: {entry.revision_info.items_count}
                  </Text>
                </Section>
              )}

              {/* Status Badges */}
              <div style={badgeContainer}>
                <span style={entry.has_invoice ? badgeGreen : badgeGray}>
                  {entry.has_invoice ? 'Invoice' : 'No Invoice'}
                </span>
                <span style={entry.has_revision ? badgeGreen : badgeGray}>
                  {entry.has_revision ? 'Revised' : 'Not Revised'}
                </span>
              </div>
            </Section>
          ))}
        </>
      )}

      {/* Attachments Summary */}
      {totalAttachments > 0 && (
        <Section style={attachmentSection}>
          <Text style={sectionTitle}>Attached Documents ({totalAttachments})</Text>
          <Text style={attachmentDetail}>
            This email includes the following documents:
          </Text>
          <ul style={attachmentList}>
            {attachments_summary.entry_pdfs > 0 && (
              <li>Entry Cover Sheets: {attachments_summary.entry_pdfs}</li>
            )}
            {attachments_summary.revisions > 0 && (
              <li>Revisions (Excel): {attachments_summary.revisions}</li>
            )}
            {attachments_summary.invoices > 0 && (
              <li>Invoices: {attachments_summary.invoices}</li>
            )}
            {attachments_summary.other_attachments > 0 && (
              <li>Other Attachments: {attachments_summary.other_attachments}</li>
            )}
          </ul>
        </Section>
      )}

      <Hr style={hr} />

      <Text style={paragraph}>
        If you have any questions about this shipment, please do not hesitate to contact us.
      </Text>

      <Text style={paragraph}>
        Thank you for your business,<br />
        <strong>Core Logistics Team</strong>
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
  marginBottom: '16px',
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
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  borderLeft: '4px solid #0284c7',
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
  margin: '6px 0',
}

const entryCard = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #e5e7eb',
}

const entryTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1f4e79',
  marginBottom: '8px',
}

const entryDetail = {
  fontSize: '13px',
  lineHeight: '18px',
  color: '#4b5563',
  margin: '4px 0',
}

const revisionBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '6px',
  padding: '12px',
  marginTop: '8px',
  borderLeft: '3px solid #10b981',
}

const revisionTitle = {
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#059669',
  marginBottom: '6px',
}

const revisionDetail = {
  fontSize: '12px',
  color: '#047857',
  margin: '2px 0',
}

const badgeContainer = {
  marginTop: '10px',
  display: 'flex',
  gap: '8px',
}

const badgeGreen = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 'bold',
  backgroundColor: '#dcfce7',
  color: '#166534',
}

const badgeGray = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 'bold',
  backgroundColor: '#f3f4f6',
  color: '#6b7280',
}

const attachmentSection = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
  borderLeft: '4px solid #f59e0b',
}

const attachmentDetail = {
  fontSize: '14px',
  color: '#92400e',
  marginBottom: '8px',
}

const attachmentList = {
  fontSize: '13px',
  color: '#92400e',
  margin: '0',
  paddingLeft: '20px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
}
