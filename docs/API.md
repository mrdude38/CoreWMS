# CoreWMS Backend API Documentation

Base URL: `/api/v1`

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## User Roles

| Role | Description |
|------|-------------|
| `admin` | Full system access |
| `manager` | Can manage most resources, limited admin functions |
| `operator` | Can create and update entries/load orders |
| `viewer` | Read-only access |
| `client` | Limited to their own client's data |

---

## Public Endpoints

### Health Check

```
GET /health
```

Returns service health status.

**Response:**
```json
{
  "status": "ok",
  "service": "CoreWMS Backend",
  "version": "1.0.0"
}
```

---

## Authentication Endpoints

### Sign Up

```
POST /auth/signup
```

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

---

### Sign In

```
POST /auth/signin
```

Authenticate and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 3600,
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "role": "viewer",
    "client_id": null,
    "is_active": true
  }
}
```

---

### Refresh Token

```
POST /auth/refresh
```

Get a new access token using a refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 3600,
  "token_type": "bearer"
}
```

---

### Reset Password

```
POST /auth/reset-password
```

Send a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "redirect_to": "https://app.example.com/reset"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

---

### Confirm Password Reset

```
POST /auth/confirm-reset
```

Set new password using the token received by email (e.g. from the reset-password link). No authentication required.

**Request Body:**
```json
{
  "token": "eyJ...",
  "new_password": "newsecurepassword"
}
```

Alternatively the frontend may send `access_token` instead of `token` (same value from the reset link).

**Response (200):**
```json
{
  "message": "Password has been reset successfully."
}
```

**Error (400):** Invalid or expired token, or password shorter than 8 characters.

---

### Sign Out

```
POST /auth/signout
```

Log out the current user.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Protected Endpoints

All endpoints below require authentication.

### Dashboard

```
GET /dashboard
```

Returns dashboard statistics and recent data, with role/client filtering applied on the backend.

**Response (200):**
```json
{
  "stats": {
    "total_entries": 100,
    "pending_entries": 5,
    "today_entries_count": 3,
    "total_load_orders": 50,
    "open_load_orders": 4,
    "total_clients": 10,
    "total_packages": 500
  },
  "open_load_orders": [
    {
      "id": "uuid",
      "order_number": "LO-001",
      "status": "open",
      "client": { ... },
      "carrier": { ... }
    }
  ],
  "today_entries_count": 3,
  "recent_entries": [ ... ],
  "recent_load_orders": [ ... ]
}
```

Use `open_load_orders` for the “recent open load orders” widget and `today_entries_count` for today’s entry count.

---

### Get Current User

```
GET /me
```

Get the currently authenticated user's information.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "role": "operator",
    "client_id": "uuid",
    "is_active": true,
    "client": { ... }
  }
}
```

---

## Catalogs

### Clients

#### List All Clients

```
GET /catalogs/clients
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `active` | boolean | Filter by active status (`true` for active only) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Client Name",
      "email": "client@example.com",
      "phone": "+1234567890",
      "active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### Search Clients

```
GET /catalogs/clients/search
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (matches name) |

**Response (200):**
```json
{
  "data": [...]
}
```

---

#### Get Client by ID

```
GET /catalogs/clients/:id
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Client Name",
    "email": "client@example.com",
    "phone": "+1234567890",
    "active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

#### Create Client

```
POST /catalogs/clients
```

**Required Permission:** `create:catalog`

**Request Body:**
```json
{
  "name": "Client Name",
  "email": "client@example.com",
  "phone": "+1234567890",
  "active": true
}
```

**Response (201):**
```json
{
  "data": { ... },
  "message": "Client created successfully"
}
```

---

#### Update Client

```
PUT /catalogs/clients/:id
```

**Required Permission:** `update:catalog`

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "email": "new@example.com",
  "phone": "+0987654321",
  "active": false
}
```

**Response (200):**
```json
{
  "data": { ... },
  "message": "Client updated successfully"
}
```

---

#### Delete Client

```
DELETE /catalogs/clients/:id
```

**Required Role:** `admin` or `manager`

**Response (200):**
```json
{
  "message": "Client deleted successfully"
}
```

---

### Suppliers

#### List All Suppliers

```
GET /catalogs/suppliers
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Supplier Name",
      "contact_name": "John Doe",
      "email": "supplier@example.com",
      "phone": "+1234567890",
      "address": "123 Main St",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": null
    }
  ]
}
```

---

#### Search Suppliers

```
GET /catalogs/suppliers/search?q=<query>
```

---

#### Get Supplier by ID

```
GET /catalogs/suppliers/:id
```

---

#### Create Supplier

```
POST /catalogs/suppliers
```

**Request Body:**
```json
{
  "name": "Supplier Name",
  "contact_name": "John Doe",
  "email": "supplier@example.com",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

---

#### Update Supplier

```
PUT /catalogs/suppliers/:id
```

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "contact_name": "Jane Doe",
  "email": "new@example.com",
  "phone": "+0987654321",
  "address": "456 Oak Ave"
}
```

---

#### Delete Supplier

```
DELETE /catalogs/suppliers/:id
```

**Required Role:** `admin` or `manager`

---

### Carriers

#### List All Carriers

```
GET /catalogs/carriers
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Carrier Name",
      "contact_name": "Driver Name",
      "email": "carrier@example.com",
      "phone": "+1234567890",
      "license_plate": "ABC-123",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": null
    }
  ]
}
```

---

#### Search Carriers

```
GET /catalogs/carriers/search?q=<query>
```

---

#### Get Carrier by ID

```
GET /catalogs/carriers/:id
```

---

#### Create Carrier

```
POST /catalogs/carriers
```

**Request Body:**
```json
{
  "name": "Carrier Name",
  "contact_name": "Driver Name",
  "email": "carrier@example.com",
  "phone": "+1234567890",
  "license_plate": "ABC-123"
}
```

---

#### Update Carrier

```
PUT /catalogs/carriers/:id
```

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "contact_name": "New Driver",
  "email": "new@example.com",
  "phone": "+0987654321",
  "license_plate": "XYZ-789"
}
```

---

#### Delete Carrier

```
DELETE /catalogs/carriers/:id
```

**Required Role:** `admin` or `manager`

---

### Package Types

#### List Package Types

```
GET /catalogs/package-types
```

Returns active package types for entries and report filters.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Caja",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Operators

#### List Operators

```
GET /catalogs/operators
```

Returns users who can perform operations (e.g. for `received_by` on entries). Excludes client-role users.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "role": "operator"
    }
  ]
}
```

---

## Entries

Warehouse receiving records.

### Entry Status Values

| Status | Description |
|--------|-------------|
| `pending` | Entry is pending processing |
| `received` | Entry has been received and processed |

---

#### List All Entries

```
GET /entries
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `page_size` | integer | Items per page (default: 20) |
| `search` | string | Search in entry number, tracking, BOL |
| `client_id` | uuid | Filter by client |
| `supplier_id` | uuid | Filter by supplier |
| `status` | string | Filter by status (`pending`, `received`) |
| `start_date` | date | Filter entries from date (YYYY-MM-DD) |
| `end_date` | date | Filter entries to date (YYYY-MM-DD) |

**Response (200):**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5
}
```

---

#### Get Entry by ID

```
GET /entries/:id
```

Returns the entry with **relations** and **attachments** so the entry detail page can use a single request (no extra Supabase/catalog calls). Includes `client`, `supplier`, `carrier`, and `attachments[]`.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "entry_number": "ENT-001",
    "client_id": "uuid",
    "supplier_id": "uuid",
    "carrier_id": "uuid",
    "tracking_number": "TRACK123",
    "bol_number": "BOL456",
    "entry_date": "2024-01-15T00:00:00Z",
    "status": "pending",
    "total_packages": 10,
    "package_type": "boxes",
    "total_weight": 150.5,
    "received_by": "uuid",
    "description": "Electronic components",
    "notes": "Handle with care",
    "is_damaged": false,
    "po_number": "PO-789",
    "has_invoice": true,
    "has_revision": false,
    "has_classification": false,
    "invoice_url": "https://...",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": null,
    "client": { "id": "uuid", "name": "...", "email": "...", ... },
    "supplier": { "id": "uuid", "name": "...", ... },
    "carrier": { "id": "uuid", "name": "...", ... },
    "attachments": [
      {
        "id": "uuid",
        "entry_id": "uuid",
        "file_name": "invoice.pdf",
        "blob_url": "https://...",
        "file_type": "application/pdf",
        "file_size": 1024,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

#### Create Entry Attachment

```
POST /entries/attachments
```

Creates an attachment record for an entry. The file is uploaded to blob storage by the frontend; this endpoint stores metadata only.

**Request Body:**
```json
{
  "entry_id": "uuid",
  "file_name": "invoice.pdf",
  "blob_url": "https://...",
  "file_type": "application/pdf",
  "file_size": 1024
}
```

**Required:** `entry_id`, `file_name`, `blob_url`. `file_type` and `file_size` are optional.

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "entry_id": "uuid",
    "file_name": "invoice.pdf",
    "blob_url": "https://...",
    "file_type": "application/pdf",
    "file_size": 1024,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Attachment created successfully"
}
```

---

#### List Package Codes (Entry)

```
GET /entries/:id/package-codes
```

Returns all barcode/QR package codes for an entry (format e.g. `ENT-0020-001`). Codes are auto-generated when entry status is set to `received`.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "entry_id": "uuid",
      "package_number": 1,
      "code": "ENT-0020-001",
      "status": "available",
      "assigned_load_order_id": null,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### Generate Package Codes (Entry)

```
POST /entries/:id/package-codes/generate
```

Creates package codes for a received entry (idempotent: returns existing count if codes already exist). Entry must have `status: "received"` and `total_packages` > 0.

**Response (201):**
```json
{
  "message": "Package codes generated",
  "data": { "codes": [ ... ], "count": 10 }
}
```

**Response (200)** when codes already exist:
```json
{
  "message": "Package codes already exist",
  "data": { "count": 10 }
}
```

---

#### Create Entry

```
POST /entries
```

**Request Body:**
```json
{
  "entry_number": "ENT-001",
  "client_id": "uuid",
  "supplier_id": "uuid",
  "carrier_id": "uuid",
  "tracking_number": "TRACK123",
  "bol_number": "BOL456",
  "entry_date": "2024-01-15",
  "status": "pending",
  "total_packages": 10,
  "package_type": "boxes",
  "total_weight": 150.5,
  "received_by": "uuid",
  "description": "Electronic components",
  "notes": "Handle with care",
  "is_damaged": false,
  "po_number": "PO-789",
  "has_invoice": true,
  "has_revision": false,
  "has_classification": false,
  "invoice_url": "https://..."
}
```

**Required Fields:** `entry_number`, `entry_date`, `total_packages`

**Response (201):**
```json
{
  "data": { ... },
  "message": "Entry created successfully"
}
```

---

#### Update Entry

```
PUT /entries/:id
```

**Request Body:** (all fields optional). Includes inspection flags: `has_invoice`, `has_revision`, `has_classification`.
```json
{
  "entry_number": "ENT-001-A",
  "status": "received",
  "has_invoice": true,
  "has_revision": true,
  "has_classification": false,
  "notes": "Updated notes",
  ...
}
```

---

#### Get Entry Revision

```
GET /entries/:id/revision
```

Returns the revision (inspection) and items for an entry. Used by the inspections revision page.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "entry_id": "uuid",
    "invoice_number": "INV-001",
    "reviewer_id": "uuid",
    "reviewer": { ... },
    "review_time_minutes": 30,
    "total_weight_kg": 100.5,
    "num_bultos": 10,
    "num_tarimas": 2,
    "created_at": "...",
    "updated_at": null,
    "items": [
      {
        "id": "uuid",
        "partida_number": 1,
        "description": "...",
        "quantity": 5,
        "unit_of_measure": "KILO",
        "weight_kg": 10,
        ...
      }
    ]
  }
}
```

**Response (404):** No revision for this entry.

---

#### Create or Update Entry Revision

```
POST /entries/:id/revision
```

Creates or updates the revision and its items for an entry. Sets the entry's `has_revision` flag.

**Request Body:** See revision DTO (invoice_number, reviewer_id, review_time_minutes, total_weight_kg, num_bultos, num_tarimas, items array with partida_number, description, quantity, unit_of_measure, weight_kg, etc.).

**Response (201):**
```json
{
  "message": "Revision saved successfully",
  "data": { "id": "uuid", "entry_id": "uuid" }
}
```

---

#### Update Entry Status

```
PATCH /entries/:id/status
```

**Request Body:**
```json
{
  "status": "received"
}
```

**Response (200):**
```json
{
  "message": "Entry status updated successfully"
}
```

---

#### Delete Entry

```
DELETE /entries/:id
```

**Required Role:** `admin`

**Response (200):**
```json
{
  "message": "Entry deleted successfully"
}
```

---

## Load Orders

Shipment/dispatch orders.

### Load Order Status Values

| Status | Description |
|--------|-------------|
| `open` | Order is open for additions |
| `in_progress` | Order is being processed |
| `completed` | Order has been shipped |
| `cancelled` | Order was cancelled |

---

#### List All Load Orders

```
GET /load-orders
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `page_size` | integer | Items per page (default: 20) |
| `search` | string | Search in order number |
| `client_id` | uuid | Filter by client |
| `carrier_id` | uuid | Filter by carrier |
| `status` | string | Filter by status |
| `start_date` | date | Filter from date (YYYY-MM-DD) |
| `end_date` | date | Filter to date (YYYY-MM-DD) |

**Response (200):**
```json
{
  "data": [...],
  "total": 50,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

---

#### Get Load Order by ID

```
GET /load-orders/:id
```

Returns the load order with **items** and nested **entry** info (`entry_number`, `total_packages`) so the detail page does not need extra catalog calls. Includes `scan_verified`, `scan_verified_at` for package scan verification.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "order_number": "LO-001",
    "client_id": "uuid",
    "carrier_id": "uuid",
    "load_date": "2024-01-20T00:00:00Z",
    "status": "open",
    "destination": "New York, NY",
    "notes": "Deliver before noon",
    "total_packages": 25,
    "scan_verified": false,
    "scan_verified_at": null,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": null,
    "client": { ... },
    "carrier": { ... },
    "items": [
      {
        "id": "uuid",
        "entry_id": "uuid",
        "packages_quantity": 10,
        "is_partial": false,
        "entry": {
          "entry_number": "ENT-0020",
          "total_packages": 20
        }
      }
    ]
  }
}
```

---

#### Get Scan Verification

```
GET /load-orders/:id/scan-verification
```

Returns scan verification status: how many packages are assigned, how many have been scanned, and whether the load order can be shipped.

**Response (200):**
```json
{
  "data": {
    "load_order_id": "uuid",
    "scan_verified": false,
    "scan_verified_at": null,
    "assigned_count": 10,
    "scanned_count": 3,
    "pending_count": 7,
    "can_ship": false
  }
}
```

---

#### Record Scan

```
POST /load-orders/:id/scan
```

Records a package code scan (e.g. from a barcode scanner). The package must be assigned to this load order. When all assigned packages are scanned, `scan_verified` is set automatically.

**Request Body:**
```json
{
  "scanned_code": "ENT-0020-001"
}
```

**Response (201):**
```json
{
  "message": "Scan recorded",
  "data": { "scanned_code": "ENT-0020-001" }
}
```

**Response (200)** if the code was already scanned (idempotent).

---

#### Create Load Order

```
POST /load-orders
```

**Request Body:**
```json
{
  "order_number": "LO-001",
  "client_id": "uuid",
  "carrier_id": "uuid",
  "load_date": "2024-01-20",
  "status": "open",
  "destination": "New York, NY",
  "notes": "Deliver before noon",
  "total_packages": 25
}
```

**Required Fields:** `order_number`, `total_packages`

---

#### Update Load Order

```
PUT /load-orders/:id
```

**Request Body:** (all fields optional)
```json
{
  "order_number": "LO-001-A",
  "status": "in_progress",
  "destination": "Boston, MA",
  ...
}
```

---

#### Update Load Order Status

```
PATCH /load-orders/:id/status
```

**Request Body:**
```json
{
  "status": "completed"
}
```

When setting `status` to `completed` (shipped), all assigned packages must be scanned first. If the load order has assigned package codes and `scan_verified` is false, the request returns `400` with an error. Package codes are marked as `shipped` when the load order is completed.

---

#### Delete Load Order

```
DELETE /load-orders/:id
```

**Required Role:** `admin` or `manager`

---

## Reports

Report endpoints return aggregated or filtered data for the reports page. All require `read:Report` permission. Results are filtered by client for `client`-role users.

### Inventory Report

```
GET /reports/inventory
```

**Query Parameters:**
| Parameter   | Type | Description                    |
|------------|------|--------------------------------|
| `client_id` | uuid | Optional; filter by client    |

**Response (200):**
```json
{
  "data": [
    {
      "entry": { "id": "uuid", "entry_number": "ENT-001", "total_packages": 10, ... },
      "available": 8,
      "shipped": 0,
      "assigned": 2
    }
  ],
  "total": 25
}
```

---

### Entries Report

```
GET /reports/entries
```

**Query Parameters:** `page`, `page_size`, `client_id`, `status`, `start_date`, `end_date`, `search`.

**Response (200):** Same shape as `GET /entries` (paginated list with `data`, `total`, `page`, `page_size`, `total_pages`).

---

### Exits Report

```
GET /reports/exits
```

Returns completed (shipped) load orders with filters.

**Query Parameters:** `page`, `page_size`, `client_id`, `start_date`, `end_date`, `search`.

**Response (200):** Paginated load orders (same shape as `GET /load-orders`).

---

### Performance Report

```
GET /reports/performance
```

**Query Parameters:**
| Parameter   | Type | Description                          |
|------------|------|--------------------------------------|
| `start_date` | date | Start of range (YYYY-MM-DD); default 30 days ago |
| `end_date`   | date | End of range (YYYY-MM-DD); default today |

**Response (200):**
```json
{
  "data": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "entries_count": 50,
    "load_orders_count": 20,
    "total_packages_entries": 500,
    "total_packages_load_orders": 450,
    "total_weight_kg": 1200.5,
    "clients_count": 10,
    "suppliers_count": 15,
    "carriers_count": 8
  }
}
```

---

## Admin Endpoints

All admin endpoints require the `admin` role.

### List All Users

```
GET /admin/users
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "role": "operator",
      "client_id": "uuid",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": null,
      "client": { ... }
    }
  ]
}
```

---

### Get User by ID

```
GET /admin/users/:id
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "role": "operator",
    "client_id": "uuid",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "client": { ... }
  }
}
```

---

### Update User Role

```
PUT /admin/users/:id/role
```

**Request Body:**
```json
{
  "role": "manager"
}
```

**Valid Roles:** `admin`, `manager`, `operator`, `viewer`, `client`

**Response (200):**
```json
{
  "message": "User role updated successfully"
}
```

---

### Update User Status

```
PUT /admin/users/:id/status
```

**Request Body:**
```json
{
  "is_active": false
}
```

**Response (200):**
```json
{
  "message": "User status updated successfully"
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Frontend Data Migration – Endpoint Summary

These endpoints support replacing all Supabase data calls with backend API calls:

| Use case | Method | Path |
|----------|--------|------|
| Password reset (set new password) | POST | `/auth/confirm-reset` |
| Package types for entries/filters | GET | `/catalogs/package-types` |
| Operators (e.g. received_by) | GET | `/catalogs/operators` |
| Entry detail with relations + attachments | GET | `/entries/:id` |
| Create entry attachment (metadata) | POST | `/entries/attachments` |
| Entry revision get/save | GET / POST | `/entries/:id/revision` |
| Dashboard (open orders + today count) | GET | `/dashboard` |
| Inventory report | GET | `/reports/inventory` |
| Entries report | GET | `/reports/entries` |
| Exits report | GET | `/reports/exits` |
| Performance report | GET | `/reports/performance` |
| Load order detail with items + entry info | GET | `/load-orders/:id` |
| Inspections (entry flags) | PUT | `/entries/:id` (`has_invoice`, `has_revision`, `has_classification`) |
| Shipments / Exits list | GET | `/load-orders?status=completed` |
| Inspections list | GET | `/entries` (use `status`, etc.) |
