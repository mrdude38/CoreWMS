export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  active?: boolean
  created_at: string
}

export interface Supplier {
  id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Carrier {
  id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  license_plate?: string
  created_at: string
  updated_at: string
}

export interface Entry {
  id: string
  entry_number: string
  client_id?: string
  supplier_id?: string
  carrier_id?: string
  tracking_number?: string
  bol_number?: string
  po_number?: string
  maniobras_entry_number?: string
  entry_date: string
  status: "pending" | "received" | "pendiente" | "recibido"
  total_packages: number
  package_type?: string
  total_weight?: number
  received_by?: string
  description?: string
  notes?: string
  is_damaged: boolean
  damage_description?: string
  // Inspection fields
  has_invoice: boolean
  has_revision: boolean
  has_classification: boolean
  invoice_url?: string
  created_at: string
  updated_at: string
  client?: Client
  supplier?: Supplier
  carrier?: Carrier
  clients?: Client
  suppliers?: Supplier
  carriers?: Carrier
}

export interface PreEntry {
  id: string
  tracking_number: string
  client_id?: string
  expected_date?: string
  status: "pending" | "arrived" | "converted"
  description?: string
  quantity: number
  notes?: string
  created_at: string
  updated_at: string
  clients?: Client
}

// Package code for barcode/QR verification (format e.g. ENT-0020-001)
export interface EntryPackageCode {
  id: string
  entry_id: string
  package_number: number
  code: string
  status: 'available' | 'assigned' | 'shipped'
  assigned_load_order_id?: string | null
  created_at: string
}

// Scan verification for a load order
export interface LoadOrderScanVerification {
  load_order_id: string
  scan_verified: boolean
  scan_verified_at: string | null
  assigned_count: number
  scanned_count: number
  pending_count: number
  can_ship: boolean
}

export interface LoadOrder {
  id: string
  order_number: string
  client_id?: string
  carrier_id?: string
  load_date?: string
  status: "open" | "in_progress" | "completed" | "cancelled"
  destination?: string
  notes?: string
  total_packages: number
  scan_verified?: boolean
  scan_verified_at?: string | null
  created_at: string
  updated_at: string
  client?: Client
  carrier?: Carrier
  clients?: Client
  carriers?: Carrier
}

export interface Exit {
  id: string
  exit_number: string
  load_order_id?: string
  exit_date: string
  status: "pending" | "dispatched" | "delivered"
  notes?: string
  total_packages: number
  created_at: string
  updated_at: string
  load_orders?: LoadOrder
}

export interface PackageType {
  id: string
  name: string
  created_at: string
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

// Warehouse operator (renamed from users table - for received_by field in entries)
export interface WarehouseOperator {
  id: string
  name: string
  email: string | null
  created_at: string
}

// User profile (linked to auth.users - for authentication and authorization)
export interface UserProfile {
  id: string
  full_name: string
  role: 'admin' | 'manager' | 'operator' | 'viewer' | 'client'
  client_id?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  clients?: Client
}

// Role permissions matrix
export interface RolePermission {
  id: string
  role: string
  resource: string
  can_create: boolean
  can_read: boolean
  can_update: boolean
  can_delete: boolean
  created_at: string
}

export interface EntryAttachment {
  id: string
  entry_id: string
  file_name: string
  blob_url: string  // Full URL in Vercel Blob storage
  file_type?: string
  file_size?: number
  created_at: string
}

// Email notification types
export type EmailTemplate =
  | 'entry-notification'
  | 'load-order-notification'
  | 'user-welcome'
  | 'password-reset'
  | 'inventory-report'
  | 'weekly-summary'

export interface EmailNotificationPreferences {
  id: string
  user_profile_id: string
  entry_notifications: boolean
  load_order_notifications: boolean
  report_notifications: boolean
  weekly_summary: boolean
  created_at: string
  updated_at: string
}

export interface EmailLog {
  id: string
  template: EmailTemplate
  recipient_email: string
  subject: string
  status: 'sent' | 'failed' | 'pending'
  error_message?: string
  metadata?: Record<string, any>
  sent_at?: string
  created_at: string
}

// Entry Revision types
export interface EntryRevision {
  id: string
  entry_id: string
  invoice_number?: string
  reviewer_id?: string
  review_time_minutes: number
  total_weight_kg: number
  num_bultos: number
  num_tarimas: number
  created_at: string
  updated_at: string
  entries?: Entry
  profiles?: UserProfile
}

export interface EntryRevisionItem {
  id: string
  revision_id: string
  partida_number: number
  description?: string
  brand?: string
  model?: string
  part_number?: string
  serial_number?: string
  origin?: string
  quantity: number
  unit_of_measure?: string
  weight_kg: number
  is_on_tarima?: boolean
  created_at: string
  updated_at: string
}
