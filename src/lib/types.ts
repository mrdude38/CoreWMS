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
  entry_date: string
  status: "pending" | "received"
  total_packages: number
  package_type?: string
  total_weight_lbs?: number
  received_by?: string
  description?: string
  notes?: string
  is_damaged: boolean
  po_number?: string
  created_at: string
  updated_at: string
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
  created_at: string
  updated_at: string
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
  file_url: string
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
