# CHANGELOG - CoreWMS

Este archivo documenta los cambios realizados en el sistema para coordinación entre desarrolladores.

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
