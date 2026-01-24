# Backend API Requirements

This document outlines the backend API endpoints and their current implementation status. 

## Implementation Status

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/auth/login` | ✅ Implemented | Login with user profile and session tokens |
| `POST /api/auth/refresh` | ✅ Implemented | Refresh token with session object |
| `POST /api/auth/logout` | ✅ Implemented | Logout (requires auth) |
| `GET /api/auth/me` | ✅ Implemented | Get current user profile (requires auth) |
| `GET /api/admin/users` | ✅ Implemented | Lists all users with pagination |
| `POST /api/admin/users` | ✅ Implemented | Creates new user with Supabase Admin API |
| `GET /api/admin/users/:id` | ✅ Implemented | Gets single user details |
| `PATCH /api/admin/users/:id` | ✅ Implemented | Updates user profile and auth metadata |
| `DELETE /api/admin/users/:id` | ✅ Implemented | Deletes user from auth and profiles |
| `POST /api/emails/exit-notification` | ✅ Implemented | Sends exit notification via Resend API |
| `POST /api/emails/send-revision` | ✅ Implemented | Sends revision email with CSV attachment |
| `POST /api/emails/load-order-notification` | ✅ Implemented | Sends load order notification email |
| `GET /api/entries/suppliers-by-client` | ✅ Implemented | Filter suppliers by client usage |
| `GET /api/entries/available-for-load-order` | ✅ Implemented | Get entries available for load orders |
| `POST /api/load-orders` | ✅ Implemented | Create load order with items (includes economic_number) |
| `PATCH /api/load-orders/:id` | ✅ Implemented | Update load order (includes economic_number) |
| `GET /api/load-orders/:id` | ✅ Implemented | Get load order with items (includes economic_number) |

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key (for email sending)
```

## Authentication APIs

### POST `/api/auth/login`
Authenticate a user and return session tokens.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (Success - 200):**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "full_name": "string",
    "role": "admin" | "manager" | "operator" | "viewer" | "client",
    "client_id": "string | null",
    "is_active": "boolean"
  },
  "session": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": 3600,
    "expires_at": 1234567890
  }
}
```

**Response (Error - 401):**
```json
{
  "error": "Invalid email or password"
}
```

**Response (Error - 403):**
```json
{
  "error": "Account is inactive. Please contact an administrator."
}
```

**Business Logic:**
1. Validate email and password are provided
2. Call Supabase Auth to authenticate:
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email,
     password
   })
   ```
3. If authentication fails, return 401 with generic error message
4. Fetch user profile from `user_profiles` table using the authenticated user ID
5. Check if user `is_active` - if false, return 403
6. Return user profile data along with session tokens

**Implementation Example:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user is active
    if (!profile.is_active) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact an administrator.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: profile.full_name,
        role: profile.role,
        client_id: profile.client_id,
        is_active: profile.is_active
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_in: authData.session?.expires_in,
        expires_at: authData.session?.expires_at
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

### POST `/api/auth/refresh`
Refresh an expired access token using a refresh token.

**Request Body:**
```json
{
  "refresh_token": "string"
}
```

**Response (Success - 200):**
```json
{
  "session": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": 3600,
    "expires_at": 1234567890
  }
}
```

**Business Logic:**
1. Call Supabase to refresh the session:
   ```typescript
   const { data, error } = await supabase.auth.refreshSession({
     refresh_token
   })
   ```
2. Return new session tokens

---

### POST `/api/auth/logout`
Sign out the current user and invalidate session.

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```json
{
  "success": true
}
```

**Business Logic:**
1. Extract access token from Authorization header
2. Call Supabase to sign out:
   ```typescript
   await supabase.auth.signOut()
   ```
3. Return success response

---

### GET `/api/auth/me`
Get the current authenticated user's profile.

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```json
{
  "id": "string",
  "email": "string",
  "full_name": "string",
  "role": "admin" | "manager" | "operator" | "viewer" | "client",
  "client_id": "string | null",
  "is_active": "boolean",
  "created_at": "string",
  "updated_at": "string"
}
```

**Business Logic:**
1. Validate the access token from Authorization header
2. Get user from token:
   ```typescript
   const { data: { user }, error } = await supabase.auth.getUser(token)
   ```
3. Fetch full profile from `user_profiles` table
4. Return user profile

---

## User Management APIs

### POST `/api/admin/users`
Create a new user account directly (bypasses normal signup flow).

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "full_name": "string",
  "role": "admin" | "manager" | "operator" | "viewer" | "client",
  "client_id": "string | null",
  "skip_email_verification": "boolean"
}
```

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "full_name": "string",
  "role": "string",
  "client_id": "string | null",
  "is_active": "boolean",
  "created_at": "string"
}
```

**Business Logic:**
- Validate admin permissions using CASL ability check
- Create user in auth system (e.g., Supabase Admin API)
- Auto-confirm email if `skip_email_verification` is true
- Create corresponding user_profile record
- Set user metadata (full_name, role, client_id)

---

### GET `/api/admin/users/:id`
Get a single user's details.

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "full_name": "string",
  "role": "string",
  "client_id": "string | null",
  "is_active": "boolean",
  "created_at": "string",
  "updated_at": "string"
}
```

---

### PATCH `/api/admin/users/:id`
Update user profile and permissions.

**Request Body:**
```json
{
  "full_name": "string (optional)",
  "role": "string (optional)",
  "is_active": "boolean (optional)",
  "client_id": "string | null (optional)"
}
```

**Response:**
```json
{
  "success": true
}
```

**Business Logic:**
- Validate admin permissions
- Validate role is one of: admin, manager, operator, viewer, client
- If role is 'client', require client_id
- Update user_profiles table
- Update user metadata in auth system

---

### DELETE `/api/admin/users/:id`
Delete a user account.

**Response:**
```json
{
  "success": true
}
```

**Business Logic:**
- Validate admin permissions
- Prevent self-deletion
- Delete user from auth system
- Delete corresponding user_profile record

---

## Email Notification APIs

### POST `/api/emails/exit-notification`
Send exit notification email when a load order status changes to "salida".

**Request Body:**
```json
{
  "load_order_id": "string"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "string",
  "attachmentsCount": 0
}
```

**Business Logic:**
1. Fetch load order with client and carrier details (including `economic_number`)
2. Fetch all entries associated with the load order via `load_order_items` junction table
3. For each entry, collect:
   - Entry details (entry_number, description, supplier, tracking, etc.)
   - Revision data if `has_revision = true` (from `entry_revisions` table)
   - Invoice attachment if `has_invoice = true`
   - Any other attachments from `entry_attachments` table
4. Generate exit cover sheet PDF using `ExitCoverSheetPDF` component (includes `economic_number`)
5. Generate Excel revision files for entries with revisions
6. Compile email using `ExitNotification` email template (includes `economic_number`)
7. Send email to client with all attachments via Resend API
8. Return success with attachment count

**Templates Used:**
- Email: `src/emails/exit-notification.tsx`
- PDF: `src/lib/pdf/exit-cover-sheet-pdf.tsx`

**Data Structure for Email Template:**
```typescript
interface ExitNotificationProps {
  order_number: string
  client_name: string
  carrier_name?: string
  total_packages: number
  exit_date: string
  destination?: string
  pedimento_invoice_number?: string
  economic_number?: string  // NEW FIELD
  entries: EntryInfo[]
  attachments_summary: {
    entry_pdfs: number
    invoices: number
    revisions: number
    other_attachments: number
  }
}
```

**Data Structure for PDF Template:**
```typescript
interface ExitCoverSheetPDFProps {
  order_number: string
  client_name: string
  carrier_name?: string
  total_packages: number
  exit_date: string
  destination?: string
  pedimento_invoice_number?: string
  economic_number?: string  // NEW FIELD
  entries: EntryInfo[]
  logoUrl?: string
}
```

---

### POST `/api/emails/send-revision`
Send revision notification email with Excel attachment.

**Request Body:**
```json
{
  "entry_id": "string",
  "entry_number": "string",
  "client_name": "string",
  "supplier_name": "string",
  "invoice_number": "string",
  "reviewer_name": "string",
  "review_time_minutes": 0,
  "total_weight_kg": 0,
  "num_bultos": 0,
  "num_tarimas": 0,
  "total_bultos": 0,
  "items": [
    {
      "partida_number": 1,
      "description": "string",
      "brand": "string",
      "model": "string",
      "part_number": "string",
      "serial_number": "string",
      "origin": "string",
      "quantity": 0,
      "unit_of_measure": "string",
      "weight_kg": 0,
      "is_on_tarima": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "string",
  "attachmentsCount": 0
}
```

**Business Logic:**
- Fetch entry with client email
- Generate styled Excel spreadsheet with revision data
- Include invoice attachment if available
- Send email to client

---

### POST `/api/emails/load-order-notification`
Send load order notification when created.

**Request Body:**
```json
{
  "loadOrder": {
    "id": "string",
    "order_number": "string",
    "clients": {
      "id": "string",
      "name": "string",
      "email": "string"
    },
    "carriers": {
      "id": "string",
      "name": "string"
    }
  },
  "entries": [
    {
      "entry_number": "string",
      "packages_quantity": 0,
      "maniobras_entry_number": "string | null"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "string"
}
```

---

## Database Schema Updates Required

### entries table
Add the following columns if not present:
- `maniobras_entry_number` (varchar, nullable) - CW entry number for internal tracking

### load_orders table
Ensure the following columns exist:
- `notes` (text, nullable) - Additional notes for load orders
- `economic_number` (text, nullable) - Economic number for the load order

```sql
-- Add economic_number column to load_orders table
ALTER TABLE load_orders ADD COLUMN IF NOT EXISTS economic_number TEXT;
```

### entry_revision_items table
Add the following column if not present:
- `is_on_tarima` (boolean, default false) - Whether item is on a pallet

---

## PDF/Excel Generation

### Exit Cover Sheet PDF
Generate a cover sheet PDF for exit shipments containing:
- Load order number
- Client name
- Carrier name
- List of entries with quantities
- Total packages

### Revision Excel
Generate styled Excel spreadsheet with:
- Header section (entry number, client, supplier, invoice, reviewer, time, weight, bultos, tarimas)
- Table with columns: # Partida, Description, Brand, Model, Part ID/#, Serial #, Origin, Quantity, Unit, Weight (KG), On Pallet (if tarimas > 0)
- Professional styling using xlsx-js-style

### Entry PDF
Already exists - ensure it includes all entry details for attachment purposes.

---

## SAT Units of Measure

The following SAT-compliant units of measure should be available in the revision form:
- KILO
- GRAMO
- METRO LINEAL
- METRO CUADRADO
- METRO CUBICO
- PIEZA
- CABEZA
- LITRO
- JUEGO
- KILOWATT
- MILLAR
- GRUESA
- KILOWATT/HORA
- TONELADA
- BARRIL
- GRAMO NETO
- DECENAS
- CIENTOS
- DOCENAS
- CAJA
- BOTELLA
- PAR

---

## Authentication & Authorization

All admin endpoints require:
1. Valid authentication (Bearer token or session)
2. Admin role check using CASL ability: `ability.can('manage', 'all')`

Email endpoints require:
1. Valid authentication
2. Permission check: `ability.can('create', 'Email')`

---

## Error Responses

All endpoints should return consistent error responses:

```json
{
  "error": "Error message description"
}
```

With appropriate HTTP status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

---

## Frontend Direct Supabase Calls (To Be Migrated)

The following files contain direct Supabase calls that should be migrated to backend APIs:

### Authentication (Priority: HIGH)

| File | Current Call | Recommended Backend API |
|------|--------------|------------------------|
| `src/app/auth/login/page.tsx` | `supabase.auth.signInWithPassword()` | `POST /api/auth/login` |
| `src/app/auth/login/page.tsx` | `supabase.from('user_profiles').select()` | Included in login response |
| `src/app/auth/reset-password/page.tsx` | `supabase.auth.updateUser()` | `POST /api/auth/reset-password` |
| `src/lib/auth/auth-context.tsx` | `supabase.auth.signOut()` | `POST /api/auth/logout` |

### Entries (Priority: HIGH)

| File | Current Call | Recommended Backend API |
|------|--------------|------------------------|
| `src/app/operations/entries/new/page.tsx` | `supabase.from("entries").insert()` | `POST /api/entries` |
| `src/app/operations/entries/new/page.tsx` | `supabase.from("entry_attachments").insert()` | Include in `POST /api/entries` |
| `src/app/operations/entries/new/page.tsx` | `supabase.from("suppliers").insert()` | `POST /api/catalogs/suppliers` |
| `src/app/operations/entries/[id]/edit/page.tsx` | `supabase.from("entries").update()` | `PATCH /api/entries/:id` |
| `src/app/operations/entries/[id]/edit/page.tsx` | `supabase.from("suppliers").insert()` | `POST /api/catalogs/suppliers` |
| `src/app/operations/entries/[id]/entry-actions.tsx` | `supabase.from("entries").delete()` | `DELETE /api/entries/:id` |
| `src/app/operations/entries/[id]/page.tsx` | Multiple selects for entry details | `GET /api/entries/:id` (include relations) |

### Load Orders (Priority: HIGH)

| File | Current Call | Recommended Backend API |
|------|--------------|------------------------|
| `src/app/operations/load-orders/new/page.tsx` | `supabase.from("load_orders").insert()` | `POST /api/load-orders` |
| `src/app/operations/load-orders/new/page.tsx` | `supabase.from("load_order_items").insert()` | Include in `POST /api/load-orders` |
| `src/app/operations/load-orders/[id]/edit/page.tsx` | `supabase.from("load_orders").update()` | `PATCH /api/load-orders/:id` |
| `src/app/operations/load-orders/[id]/page.tsx` | `supabase.from("load_orders").delete()` | `DELETE /api/load-orders/:id` |

### Inspections/Revisions (Priority: MEDIUM)

| File | Current Call | Recommended Backend API |
|------|--------------|------------------------|
| `src/app/operations/inspections/[id]/revision/page.tsx` | `supabase.from("entry_revisions").insert/update()` | `POST /api/revisions` or `PATCH /api/revisions/:id` |
| `src/app/operations/inspections/[id]/revision/page.tsx` | `supabase.from("entry_revision_items").insert/delete()` | Include in revision endpoints |
| `src/app/operations/inspections/[id]/page.tsx` | `supabase.from("entries").update()` | `PATCH /api/entries/:id` |

### Catalogs (Priority: MEDIUM)

| File | Current Call | Recommended Backend API |
|------|--------------|------------------------|
| `src/app/catalogs/clients/new/page.tsx` | `supabase.from("clients").insert()` | `POST /api/catalogs/clients` |
| `src/app/catalogs/clients/[id]/edit/page.tsx` | `supabase.from("clients").update()` | `PATCH /api/catalogs/clients/:id` |
| `src/app/catalogs/carriers/new/page.tsx` | `supabase.from("carriers").insert()` | `POST /api/catalogs/carriers` |
| `src/app/catalogs/suppliers/new/page.tsx` | `supabase.from("suppliers").insert()` | `POST /api/catalogs/suppliers` |

### Data Fetching (Priority: LOW - Server Components)

These are server-side data fetches and may not need migration (already run on server):

| File | Current Call | Notes |
|------|--------------|-------|
| `src/app/operations/entries/new/page.tsx` | Loads clients, suppliers, carriers, etc. | Could use service layer |
| `src/app/operations/load-orders/new/page.tsx` | Loads clients, carriers, entries | Could use service layer |
| `src/app/reports/page.tsx` | Complex report queries | Could use dedicated report API |
| `src/app/page.tsx` | Dashboard stats | Could use `GET /api/dashboard` |

---

## Recommended New Backend APIs

Based on the analysis above, implement these additional endpoints:

### Entries API

```
GET    /api/entries                    - List entries (with filters, pagination)
POST   /api/entries                    - Create entry (including attachments)
GET    /api/entries/:id                - Get entry with all relations
PATCH  /api/entries/:id                - Update entry
DELETE /api/entries/:id                - Delete entry
GET    /api/entries/suppliers-by-client - Get suppliers used by a specific client
GET    /api/entries/available-for-load-order - Get entries available for load orders
```

#### GET `/api/entries/suppliers-by-client`
Get list of suppliers that have been used in entries for a specific client.

**Query Parameters:**
- `client_id` (required): The client ID to filter by

**Response (200):**
```json
[
  {
    "id": "entry-uuid",
    "supplier_id": "supplier-uuid"
  }
]
```

**Business Logic:**
1. Query entries table for all entries matching the client_id
2. Return distinct supplier_id values
3. Frontend will use this to filter the suppliers dropdown to only show suppliers previously used by that client

**SQL Query:**
```sql
SELECT DISTINCT id, supplier_id 
FROM entries 
WHERE client_id = :client_id 
  AND supplier_id IS NOT NULL;
```

---

#### GET `/api/entries/available-for-load-order`
Get entries with status 'recibido' that have available packages for load orders.

**Query Parameters:**
- `client_id` (optional): Filter by client

**Response (200):**
```json
[
  {
    "id": "uuid",
    "entry_number": "E-2024-0001",
    "client_id": "uuid",
    "total_packages": 100,
    "packages_available": 75,
    "packages_assigned": 25,
    ...other entry fields
  }
]
```

**Business Logic:**
1. Query entries with status = 'recibido'
2. For each entry, calculate packages already assigned to non-cancelled load order items
3. Calculate packages_available = total_packages - packages_assigned
4. Only return entries where packages_available > 0

---

### Load Orders API

```
GET    /api/load-orders                - List load orders
POST   /api/load-orders                - Create load order with items
GET    /api/load-orders/:id            - Get load order with items/entries
PATCH  /api/load-orders/:id            - Update load order
DELETE /api/load-orders/:id            - Delete load order
```

#### POST `/api/load-orders`
Create a new load order with associated items.

**Request Body:**
```json
{
  "client_id": "uuid",
  "carrier_id": "uuid",
  "status": "pendiente" | "salida",
  "total_packages": 100,
  "pedimento_invoice_number": "string | null",
  "economic_number": "string | null",
  "notes": "string | null",
  "items": [
    {
      "entry_id": "uuid",
      "packages_quantity": 50,
      "is_partial": false
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "order_number": "LO-2024-0001"
}
```

**Business Logic:**
1. Generate order_number (auto-increment or formatted)
2. Insert load_order record
3. Insert load_order_items for each item in the items array
4. Return created load order

---

#### PATCH `/api/load-orders/:id`
Update a load order.

**Request Body:**
```json
{
  "status": "pendiente" | "salida",
  "economic_number": "string | null",
  "notes": "string | null"
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Business Logic:**
1. Validate load order exists
2. Update only provided fields
3. If status changes to 'salida', the frontend will trigger exit notification separately

---

#### GET `/api/load-orders/:id`
Get load order with all related data.

**Response (200):**
```json
{
  "id": "uuid",
  "order_number": "LO-2024-0001",
  "client_id": "uuid",
  "carrier_id": "uuid",
  "status": "pendiente",
  "total_packages": 100,
  "pedimento_invoice_number": "string | null",
  "economic_number": "string | null",
  "notes": "string | null",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "clients": {
    "id": "uuid",
    "name": "Client Name"
  },
  "carriers": {
    "id": "uuid",
    "name": "Carrier Name"
  },
  "items": [
    {
      "id": "uuid",
      "entry_id": "uuid",
      "packages_quantity": 50,
      "is_partial": false,
      "entries": {
        "entry_number": "E-2024-0001",
        "total_packages": 100
      }
    }
  ]
}
```

---

### Revisions API

```
GET    /api/entries/:id/revision       - Get revision for entry
POST   /api/entries/:id/revision       - Create/update revision with items
```

### Catalogs API

```
GET    /api/catalogs/clients           - List clients
POST   /api/catalogs/clients           - Create client
PATCH  /api/catalogs/clients/:id       - Update client
GET    /api/catalogs/suppliers         - List suppliers
POST   /api/catalogs/suppliers         - Create supplier
GET    /api/catalogs/carriers          - List carriers
POST   /api/catalogs/carriers          - Create carrier
GET    /api/catalogs/package-types     - List package types
GET    /api/catalogs/operators         - List operators (non-client users)
```

### Dashboard/Reports API

```
GET    /api/dashboard                  - Dashboard statistics
GET    /api/reports/inventory          - Inventory report data
GET    /api/reports/movements          - Movements report data
```

### Password Reset API

```
POST   /api/auth/forgot-password       - Request password reset email
POST   /api/auth/reset-password        - Reset password with token
```
