import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { Entry, Client, Supplier, Carrier, PackageType } from '@/lib/types'

interface EntryPDFProps {
  entry: Entry & {
    clients?: Client
    suppliers?: Supplier
    carriers?: Carrier
    package_types?: PackageType
  }
  logoUrl?: string
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 40,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  entryNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#374151',
  },
  value: {
    width: '60%',
    color: '#1f2937',
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '2 8',
    borderRadius: 4,
    fontSize: 9,
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#854d0e',
  },
  damaged: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  notes: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function EntryPDF({ entry, logoUrl }: EntryPDFProps) {
  const isReceived = entry.status === 'received' || (entry.status as string) === 'recibido'

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <Text style={styles.title}>Entry Receipt</Text>
            <Text style={styles.subtitle}>Warehouse Management System</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.entryNumber}>{entry.entry_number}</Text>
            <Text style={styles.subtitle}>{formatDate(entry.entry_date)}</Text>
          </View>
        </View>

        {/* Entry Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entry Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Entry Number:</Text>
            <Text style={styles.value}>{entry.entry_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Client:</Text>
            <Text style={styles.value}>{entry.clients?.name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Supplier:</Text>
            <Text style={styles.value}>{entry.suppliers?.name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Carrier/Freight:</Text>
            <Text style={styles.value}>{entry.carriers?.name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tracking Number:</Text>
            <Text style={styles.value}>{entry.tracking_number || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={isReceived ? styles.statusBadge : { ...styles.statusBadge, ...styles.statusPending }}>
              {isReceived ? 'Received' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Merchandise Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Merchandise Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{entry.description || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Quantity:</Text>
            <Text style={styles.value}>
              {entry.total_packages} {entry.package_types?.name || entry.package_type || 'packages'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Weight:</Text>
            <Text style={styles.value}>
              {entry.total_weight_lbs ? `${entry.total_weight_lbs} lbs` : 'N/A'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Entry Date:</Text>
            <Text style={styles.value}>{formatDate(entry.entry_date)}</Text>
          </View>
        </View>

        {/* Notes */}
        {entry.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes / Comments</Text>
            <View style={styles.notes}>
              <Text>{entry.notes}</Text>
            </View>
          </View>
        )}

        {/* Damage Report */}
        {entry.is_damaged && (
          <View style={styles.damaged}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
              Warning: Package Damaged
            </Text>
            <Text>{(entry as any).damage_description || 'Damage reported'}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by CoreWMS - Core Logistics | {new Date().toLocaleString()}
        </Text>
      </Page>
    </Document>
  )
}

export default EntryPDF
