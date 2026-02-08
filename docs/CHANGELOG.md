# CHANGELOG - CoreWMS

Este archivo documenta los cambios realizados en el sistema para coordinación entre desarrolladores.

---

## 2026-02-03

### Feature: Barcode/QR Code System for Package Verification

**Database Requirement:**
```sql
-- Table: entry_package_codes
CREATE TABLE entry_package_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  package_number INTEGER NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,  -- Format: ENT-000123-001
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'shipped')),
  assigned_load_order_id UUID REFERENCES load_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entry_id, package_number)
);

CREATE INDEX idx_entry_package_codes_entry_id ON entry_package_codes(entry_id);
CREATE INDEX idx_entry_package_codes_code ON entry_package_codes(code);

-- Table: load_order_scans
CREATE TABLE load_order_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  load_order_id UUID NOT NULL REFERENCES load_orders(id) ON DELETE CASCADE,
  package_code_id UUID NOT NULL REFERENCES entry_package_codes(id),
  scanned_code VARCHAR(50) NOT NULL,
  scanned_by UUID REFERENCES user_profiles(id),
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(load_order_id, package_code_id)
);

-- Add verification columns to load_orders
ALTER TABLE load_orders ADD COLUMN scan_verified BOOLEAN DEFAULT false;
ALTER TABLE load_orders ADD COLUMN scan_verified_at TIMESTAMPTZ;
```

**Changes:** Implemented a complete barcode/QR code system for package tracking and verification. When an entry is received (status = "recibido"), unique codes are generated for each package (format: ENT-000123-001). Users can print labels with both QR codes and barcodes. When creating load orders, package codes are marked as "assigned". Before shipping (changing status to "salida"), all assigned packages must be scanned for verification.

**Files Modified:**

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Added `EntryPackageCode` and `LoadOrderScan` interfaces |
| `src/app/operations/entries/new/page.tsx` | Generate package codes when creating entry with status "recibido" |
| `src/app/operations/entries/[id]/edit/page.tsx` | Generate package codes when status changes to "recibido" |
| `src/app/operations/entries/[id]/page.tsx` | Pass entry status and client name to actions component |
| `src/app/operations/entries/[id]/entry-actions.tsx` | Added "Print Labels" button and dialog integration |
| `src/app/operations/load-orders/new/page.tsx` | Mark package codes as "assigned" when creating load order items |
| `src/app/operations/load-orders/[id]/page.tsx` | Added scan verification panel UI |
| `src/app/operations/load-orders/[id]/edit/page.tsx` | Block "salida" status if scan verification incomplete |

**New Files Created:**

| File | Purpose |
|------|---------|
| `src/components/barcode/package-label.tsx` | Printable label component with QR code and barcode |
| `src/components/barcode/barcode-scanner.tsx` | Scanner input component for hardware barcode scanners |
| `src/components/barcode/print-labels-dialog.tsx` | Dialog for viewing and printing all package labels |
| `src/components/barcode/scan-verification-panel.tsx` | Panel showing scan progress and verification status |

**User Workflow:**
1. Entry Received → Codes auto-generated (ENT-000123-001, ENT-000123-002...)
2. Print Labels → User prints labels from entry detail page
3. Create Load Order → Select entries/packages, codes marked as "assigned"
4. Scan Before Shipping → Must scan all packages in load order
5. Ship → Status can change to "salida" only after all scanned

---

### Fix: Entry Email Resend Button Not Working

**Problem:** The "Resend Email" button on entry detail pages was not sending emails to internal users.

**Cause:** The API route was using `supabase.auth.admin.getUserById()` with the regular Supabase client (anon key), but this method requires the service role key.

**Solution:** Now uses the admin client (`createAdminClient()`) for fetching internal user emails. Also improved error handling to show clear messages when no recipients are found.

**Files Modified:**

| File | Changes |
|------|---------|
| `src/app/api/emails/entry-notification/route.ts` | Import and use `createAdminClient` for admin operations, improved error handling |
| `src/app/operations/entries/[id]/entry-actions.tsx` | Improved feedback messages when no emails are sent |

---

### Fix: Tracking Report Shipped Status Detection

**Problem:** Entries were not showing as "Shipped" in the tracking report even when they had been shipped via load orders.

**Cause:** The code was checking `entry.status === "salida"` but entries don't have "salida" status - only load orders do.

**Solution:** Now queries `load_order_items` joined with `load_orders` where status is "salida" to correctly identify shipped entries.

**Files Modified:**

| File | Changes |
|------|---------|
| `src/app/reports/tracking/page.tsx` | Added query to fetch shipped entries via load_order_items, created Set of shipped entry IDs, use Set to determine `is_shipped` status |

---

### Enhancement: Entry Number and Date Fields in New Entry Form

**Changes:** Added two new fields at the top of the new entry form:
- **Entry Number**: Read-only field showing the next entry number to be generated (e.g., ENT-0020). Auto-calculated from the last entry in the database.
- **Entry Date**: Editable datetime field, defaults to current date/time. Can be modified if needed (e.g., for backdating entries).

**Files Modified:**

| File | Changes |
|------|---------|
| `src/app/operations/entries/new/page.tsx` | Added `nextEntryNumber` and `entryDate` state variables, fetch last entry to calculate next number, added form fields for entry number (disabled) and entry date (datetime-local input) |

---

### Fix: Entry Date Timezone Issue

**Problem:** Entry date was defaulting to UTC time instead of local Pacific Time.

**Cause:** Used `toISOString().slice(0, 16)` which converts to UTC.

**Solution:** Use local date methods (`getFullYear()`, `getMonth()`, `getDate()`, `getHours()`, `getMinutes()`) to format the datetime-local input value in the user's local timezone.

**Files Modified:**

| File | Changes |
|------|---------|
| `src/app/operations/entries/new/page.tsx` | Changed `entryDate` initialization from `toISOString()` to local time formatting using individual date component methods |

---

### Feature: Visual Entry Tracking Report

**Changes:** Added a new visual tracking report that shows entry progress through milestones. Each entry displays its completion status for: Entry, Invoice, Revision, Classification, and Shipped. The report includes summary statistics, filters by client/status, and search functionality.

**Files Modified:**

| File | Changes |
|------|---------|
| `src/components/app-sidebar.tsx` | Added "Tracking" link to Reports menu section |

**New Files Created:**

| File | Purpose |
|------|---------|
| `src/app/reports/tracking/page.tsx` | Visual tracking report with milestone icons and progress indicators |

**Features:**
- Visual milestone icons showing completion status (green check for complete, gray for pending)
- Progress bar on each entry card showing percentage complete
- Summary cards showing: Total Entries, Shipped, Pending (Total - Shipped)
- Filters: Search by entry number/client, filter by client
- Milestone checkbox filters: Select milestones to show entries that have those milestones completed (Entry, Invoice, Revision, Classification, Shipped)

---

## 2026-01-29

### Feature: TXT Export (EDI/COVE Format) for Revisions

**Database Requirement:**
```sql
ALTER TABLE entry_revisions ADD COLUMN patente_aduanal TEXT;
ALTER TABLE entry_revisions ADD COLUMN clave_pedimento TEXT;
ALTER TABLE entry_revisions ADD COLUMN moneda TEXT;
ALTER TABLE entry_revisions ADD COLUMN tipo_transporte TEXT;

ALTER TABLE clients ADD COLUMN city TEXT;
ALTER TABLE clients ADD COLUMN state TEXT;
ALTER TABLE clients ADD COLUMN zip TEXT;
ALTER TABLE clients ADD COLUMN country TEXT;

ALTER TABLE suppliers ADD COLUMN city TEXT;
ALTER TABLE suppliers ADD COLUMN state TEXT;
ALTER TABLE suppliers ADD COLUMN zip TEXT;
ALTER TABLE suppliers ADD COLUMN country TEXT;
```

**Changes:** Added TXT export functionality in Mexican customs EDI/COVE format. The revision page now has an "Export TXT" button next to "Export Excel". The TXT file is also automatically attached to emails sent to clients. Added new revision fields: Patente Aduanal, Clave de Pedimento, Moneda (currency), and Tipo de Transporte. Added city/state/zip/country fields to both Client and Supplier catalogs.

**Files Modified:**

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Added `patente_aduanal`, `clave_pedimento`, `moneda`, `tipo_transporte` to `EntryRevision`. Added `city`, `state`, `zip`, `country` to `Client` and `Supplier` interfaces |
| `src/app/operations/inspections/[id]/revision/page.tsx` | Added 4 new revision input fields, updated query to fetch city/state/zip/country from clients and suppliers, added `handleExportTXT()` function, added Export TXT button |
| `src/app/api/emails/send-revision/route.ts` | Added `generateRevisionTXT()` function, TXT file now attached to revision emails |
| `src/app/catalogs/clients/new/page.tsx` | Added city, state, zip, country input fields |
| `src/app/catalogs/clients/[id]/edit/page.tsx` | Added city, state, zip, country input fields |
| `src/app/catalogs/clients/[id]/page.tsx` | Added city/state and zip/country display |
| `src/app/catalogs/suppliers/page.tsx` | Added city, state, zip, country inline editing fields |

---

## 2026-01-28

### Feature: Client/Supplier Info and New Fields in Revisions

**Database Requirement:**
```sql
ALTER TABLE entry_revisions ADD COLUMN agente_aduanal TEXT;
ALTER TABLE entry_revisions ADD COLUMN tipo_cambio NUMERIC;
ALTER TABLE entry_revisions ADD COLUMN incoterms TEXT;
ALTER TABLE entry_revisions ADD COLUMN scac_transportista TEXT;
ALTER TABLE entry_revisions ADD COLUMN cat_transportista TEXT;
```

**Changes:** The revision page now displays client information (RFC, Address, IMMEX) and supplier information (Tax ID, Address) as read-only fields, pulled from the entry's linked client and supplier. Added 5 new editable revision-level fields: Agente Aduanal, Tipo de Cambio, Incoterms, SCAC Transportista, CAT Transportista. All new fields are included in the Excel export, email template, and API route.

**Files Modified:**

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Added 5 new fields to `EntryRevision` interface |
| `src/app/operations/inspections/[id]/revision/page.tsx` | Expanded entry query to fetch client/supplier details, added client/supplier info display (read-only), added 5 new input fields, updated save/load logic, Excel export, and email payload |
| `src/emails/revision-notification.tsx` | Added client/supplier detail fields and 5 new revision fields to email template |
| `src/app/api/emails/send-revision/route.ts` | Added new fields to request parsing, Excel generation, and email data |

---

## 2026-01-27

### Feature: New Fields in Client and Supplier Catalogs

**Database Requirement:**
```sql
ALTER TABLE clients ADD COLUMN rfc TEXT;
ALTER TABLE clients ADD COLUMN address TEXT;
ALTER TABLE clients ADD COLUMN immex TEXT;

ALTER TABLE suppliers ADD COLUMN address TEXT;
-- Note: tax_id column already existed in suppliers table
```

**Changes:** Added RFC, Direccion, and IMMEX fields to the client catalog. Added Tax ID and Direccion fields to the supplier catalog (tax_id already existed, address was added). Suppliers can be edited inline from the list page.

**Files Modified:**

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Added `rfc`, `address`, `immex` to Client interface. Added `tax_id` to Supplier interface |
| `src/app/catalogs/clients/new/page.tsx` | Added RFC, Direccion, IMMEX input fields and insert logic |
| `src/app/catalogs/clients/[id]/edit/page.tsx` | Added RFC, Direccion, IMMEX input fields and update logic |
| `src/app/catalogs/clients/[id]/page.tsx` | Added RFC, Direccion, IMMEX display in detail view |
| `src/app/catalogs/suppliers/page.tsx` | Added inline editing for Tax ID and Direccion, display of fields in list |

---

### Feature: Fraccion Arancelaria and Valor Unitario in Revision Items

**Database Requirement:**
```sql
ALTER TABLE entry_revision_items ADD COLUMN fraccion_arancelaria TEXT;
ALTER TABLE entry_revision_items ADD COLUMN valor_unitario NUMERIC;
```

**Changes:** Added two new fields per partida in entry revisions: "Fraccion Arancelaria" (tariff classification / HS code) and "Valor Unitario" (unit value).

**Files Modified:**

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Added `fraccion_arancelaria` and `valor_unitario` to `EntryRevisionItem` interface |
| `src/app/operations/inspections/[id]/revision/page.tsx` | Added input fields in table for both new columns, updated Excel export and save logic |
| `src/emails/revision-notification.tsx` | Added columns to email table |
| `src/app/api/emails/send-revision/route.ts` | Added fields to RevisionItem interface and Excel generation |

---

## 2026-01-26

### Feature: Suppliers Linked to Clients

**Database Requirement:**
```sql
ALTER TABLE suppliers ADD COLUMN client_id UUID REFERENCES clients(id);
CREATE INDEX idx_suppliers_client_id ON suppliers(client_id);
```

**Problem:** Suppliers were being filtered by inferring client relationships from entry history. This caused newly added suppliers to disappear when navigating away, because they hadn't been used in any entries yet.

**Solution:** Suppliers are now explicitly linked to clients via a `client_id` column.

**Files Modified:**

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Added `client_id` and `clients` relation to Supplier interface |
| `src/app/operations/entries/new/page.tsx` | Simplified `filterSuppliersByClient()` to filter by `client_id`. Updated `handleAddSupplier()` to set `client_id` when creating supplier. |
| `src/app/operations/entries/[id]/edit/page.tsx` | Same changes. Also includes currently selected supplier for backwards compatibility. |
| `src/app/catalogs/suppliers/page.tsx` | Complete rewrite: shows only supplier name and linked client, added delete button with confirmation dialog, removed contact info display. |

**Files Removed:**
- `src/app/catalogs/suppliers/[id]/page.tsx` - View page no longer needed
- `src/app/catalogs/suppliers/new/page.tsx` - Suppliers are now created only from entries

---

## 2026-01-23

### Fix: Entries and Exits Reports

**File:** `src/app/reports/page.tsx`

**Entries Report Fix:**
- Changed `received_by_user:users(name)` to `received_by_user:user_profiles(full_name)`
- The `entries.received_by` column references `user_profiles` table, not `users`
- Updated display to use `full_name` instead of `name`

**Exits Report Fix:**
- Load orders connect to entries via `load_order_items` junction table (not directly)
- Rewrote `loadExitsReport()` to:
  1. Query load_orders with client and carrier
  2. Query load_order_items with entry details for those load orders
  3. Group items by load_order_id and combine entry numbers and package types
- Updated table headers: "Entry Number" → "Entries", "Package Type" → "Package Types"
- Now correctly shows all entries associated with each load order (comma-separated)
- Package type filter now works correctly with multiple entries

---

### Feature: Campo Economic Number en Load Orders

**Database Requirement:**
Se necesita agregar la columna `economic_number` (tipo TEXT, nullable) a la tabla `load_orders` en Supabase.

```sql
ALTER TABLE load_orders ADD COLUMN economic_number TEXT;
```

**Files Modified:**

| File | Changes |
|------|---------|
| `src/app/operations/load-orders/new/page.tsx` | Added state, input field, and insert operation for `economic_number` |
| `src/app/operations/load-orders/[id]/edit/page.tsx` | Added state, input field, load existing value, and update operation for `economic_number`. Also translated Spanish text to English |
| `src/app/operations/load-orders/[id]/page.tsx` | Added display for Economic Number in detail view |
| `src/emails/load-order-notification.tsx` | Added display for Economic Number in email template |
| `src/lib/pdf/exit-cover-sheet-pdf.tsx` | Added `economic_number` to interface, function params, and PDF display |
| `src/emails/exit-notification.tsx` | Added `economic_number` to interface, function params, and email display |
| `src/app/api/emails/exit-notification/route.ts` | Added `economic_number` to PDF generation and email data |

---

### Feature: Traducción de Español a Inglés

**Files Modified:**

| File | Changes |
|------|---------|
| `src/emails/exit-notification.tsx` | Full translation: "Notificacion de Salida" → "Exit Notification", dates from `es-MX` to `en-US`, all labels translated |
| `src/lib/pdf/exit-cover-sheet-pdf.tsx` | Full translation: "Caratula de Salida" → "Exit Cover Sheet", dates from `es-MX` to `en-US`, all labels translated |
| `src/app/api/emails/exit-notification/route.ts` | Excel headers translated, email subject changed to English, removed duplicate email to `invoices@core-logistics.com` |
| `src/app/operations/entries/page.tsx` | Added `translateStatus()` function for status badges (pendiente→Pending, recibido→Received) |
| `src/app/operations/load-orders/page.tsx` | Added `translateStatus()` function for status badges |
| `src/app/operations/shipments/page.tsx` | Removed "(Salidas)" from title, "Salida" → "Shipped" |
| `src/app/operations/inspections/page.tsx` | Added `translateStatus()`, translated labels: "Factura"→"Invoice", "Clasificacion"→"Classification" |
| `src/app/operations/load-orders/[id]/page.tsx` | "Notas" → "Notes" |
| `src/app/operations/load-orders/new/page.tsx` | "Notas" → "Notes", placeholder translated |
| `src/app/operations/load-orders/[id]/edit/page.tsx` | "Notas" → "Notes", placeholder translated, button labels translated |

---

### Fix: Removed Duplicate Email

**File:** `src/app/api/emails/exit-notification/route.ts`

Removed the duplicate email being sent to `invoices@core-logistics.com` since the client already receives all documentation.

---

### Feature: Inventory Report - Only Active Entries

**File:** `src/app/reports/page.tsx`

El reporte de inventario ahora solo muestra entradas con inventario disponible (no enviadas).

**Changes:**
- Modified `loadInventoryReport()` function to:
  - Query `load_order_items` for shipped load orders (`status = 'salida'`)
  - Calculate shipped packages per entry
  - Filter out entries where all packages have been shipped
  - Added `available_packages` and `shipped_packages` fields to inventory data
- Updated inventory table to show "Available" and "Total" columns instead of just "Packages"

---

### Feature: Suppliers Filtered by Client

**Files Modified:**

| File | Changes |
|------|---------|
| `src/app/operations/entries/new/page.tsx` | `filterSuppliersByClient()` now queries entries to find suppliers used by the selected client. New suppliers added are immediately shown in dropdown. |
| `src/app/operations/entries/[id]/edit/page.tsx` | Same filtering logic, plus ensures the current entry's supplier is always included in the dropdown |

**Logic:**
- Suppliers dropdown is disabled until a client is selected
- Only shows suppliers that have been used in previous entries for that client
- When adding a new supplier, it immediately appears in the dropdown
- In edit mode, the current supplier is always included even if no other entries exist

---

## Notes for Other Developers

- All UI text should be in English
- Date formats use `en-US` locale
- Status values in database remain in Spanish (`pendiente`, `recibido`, `salida`) but are translated for display
- The `translateStatus()` function handles the translation mapping
