import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

interface EntryInfo {
  entry_number: string
  entry_date: string
  description?: string
  total_packages: number
  packages_in_order: number
  supplier_name?: string
  tracking_number?: string
  po_number?: string
  has_invoice: boolean
  has_revision: boolean
}

interface ExitCoverSheetPDFProps {
  order_number: string
  client_name: string
  carrier_name?: string
  total_packages: number
  exit_date: string
  destination?: string
  pedimento_invoice_number?: string
  economic_number?: string
  entries: EntryInfo[]
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
    marginBottom: 25,
    borderBottomWidth: 3,
    borderBottomColor: '#2563eb',
    paddingBottom: 15,
  },
  logo: {
    width: 120,
    height: 40,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#2563eb',
    padding: 8,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  label: {
    width: '35%',
    fontWeight: 'bold',
    color: '#374151',
  },
  value: {
    width: '65%',
    color: '#1f2937',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 9,
    color: '#1f2937',
  },
  // Column widths
  colEntry: { width: '15%' },
  colSupplier: { width: '20%' },
  colDescription: { width: '30%' },
  colTracking: { width: '15%' },
  colPackages: { width: '10%', textAlign: 'center' },
  colPO: { width: '10%' },
  summaryBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 4,
    padding: 12,
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
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
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    marginTop: 40,
    paddingTop: 8,
  },
  signatureLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ExitCoverSheetPDF({
  order_number,
  client_name,
  carrier_name,
  total_packages,
  exit_date,
  destination,
  pedimento_invoice_number,
  economic_number,
  entries,
  logoUrl,
}: ExitCoverSheetPDFProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <Text style={styles.title}>Exit Cover Sheet</Text>
            <Text style={styles.subtitle}>Shipment Documentation</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.orderNumber}>{order_number}</Text>
            <Text style={styles.subtitle}>{formatDateTime(exit_date)}</Text>
          </View>
        </View>

        {/* Exit Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exit Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Load Order:</Text>
            <Text style={styles.value}>{order_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Client:</Text>
            <Text style={styles.value}>{client_name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Carrier:</Text>
            <Text style={styles.value}>{carrier_name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Exit Date:</Text>
            <Text style={styles.value}>{formatDate(exit_date)}</Text>
          </View>
          {destination && (
            <View style={styles.row}>
              <Text style={styles.label}>Destination:</Text>
              <Text style={styles.value}>{destination}</Text>
            </View>
          )}
          {pedimento_invoice_number && (
            <View style={styles.row}>
              <Text style={styles.label}>Customs Entry / Invoice:</Text>
              <Text style={styles.value}>{pedimento_invoice_number}</Text>
            </View>
          )}
          {economic_number && (
            <View style={styles.row}>
              <Text style={styles.label}>Economic Number:</Text>
              <Text style={styles.value}>{economic_number}</Text>
            </View>
          )}
        </View>

        {/* Entries Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entries Detail ({entries.length})</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colEntry]}>Entry</Text>
              <Text style={[styles.tableHeaderCell, styles.colSupplier]}>Supplier</Text>
              <Text style={[styles.tableHeaderCell, styles.colDescription]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.colTracking]}>Tracking</Text>
              <Text style={[styles.tableHeaderCell, styles.colPO]}>PO</Text>
              <Text style={[styles.tableHeaderCell, styles.colPackages]}>Packages</Text>
            </View>

            {/* Table Rows */}
            {entries.map((entry, index) => (
              <View
                key={entry.entry_number}
                style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
              >
                <Text style={[styles.tableCell, styles.colEntry]}>{entry.entry_number}</Text>
                <Text style={[styles.tableCell, styles.colSupplier]}>
                  {entry.supplier_name || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, styles.colDescription]}>
                  {entry.description?.substring(0, 50) || 'N/A'}
                  {(entry.description?.length || 0) > 50 ? '...' : ''}
                </Text>
                <Text style={[styles.tableCell, styles.colTracking]}>
                  {entry.tracking_number || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, styles.colPO]}>{entry.po_number || 'N/A'}</Text>
                <Text style={[styles.tableCell, styles.colPackages]}>
                  {entry.packages_in_order}
                </Text>
              </View>
            ))}
          </View>

          {/* Summary Box */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Entries</Text>
              <Text style={styles.summaryValue}>{entries.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Packages</Text>
              <Text style={styles.summaryValue}>{total_packages}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Carrier</Text>
              <Text style={styles.summaryValue}>{carrier_name || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>Delivered by (Warehouse)</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>Received by (Carrier)</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by CoreWMS - Core Logistics | {new Date().toLocaleString('en-US')}
        </Text>
      </Page>
    </Document>
  )
}

export default ExitCoverSheetPDF
