# Backend Endpoints Required for Data Migration (No Direct Supabase)

This document lists **all backend API endpoints** the frontend needs so that **every data call** goes through the backend instead of Supabase. It cross-references existing docs (`API.md`, `BACKEND_API_REQUIREMENTS.md`, `API_BARCODE_PACKAGE_VERIFICATION.md`, `BACKEND_USER_MANAGEMENT.md`) and identifies what is already documented vs what is missing or needs to be added.

**Base URL:** `/api/v1`  
**Auth:** Protected endpoints require `Authorization: Bearer <access_token>`.

---

## 1. Already Documented in API.md (Backend Contract)

These endpoints are described in `docs/API.md` and are assumed to be implemented (or to be implemented) by the backend.

### 1.1 Authentication
| Method | Path | Purpose | Used By (Frontend) |
|--------|------|---------|--------------------|
| POST | `/auth/signup` | Register user | Signup page |
| POST | `/auth/signin` | Login, returns tokens + profile | Login page |
| POST | `/auth/refresh` | Refresh access token | (optional) |
| POST | `/auth/reset-password` | Send reset email | Forgot-password |
| POST | `/auth/signout` | Logout | Auth context |
| GET  | `/me` | Current user + profile | Auth context, proxy |

**Status:** In use; frontend uses backend for auth (no Supabase auth on frontend).

---

### 1.2 Catalogs – Clients
| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| GET    | `/catalogs/clients` | List clients (optional `?active=true`) | Entries new/edit, load-orders new, reports, dashboard filter |
| GET    | `/catalogs/clients/search?q=` | Search clients | — |
| GET    | `/catalogs/clients/:id` | Get client by ID | Client detail page, client edit |
| POST   | `/catalogs/clients` | Create client | Catalogs clients new |
| PUT    | `/catalogs/clients/:id` | Update client | Catalogs clients edit |
| DELETE | `/catalogs/clients/:id` | Delete client | — |

**Status:** Documented in API.md. Frontend still uses Supabase in `catalogs/clients/[id]/page.tsx`, `catalogs/clients/new/page.tsx`, `catalogs/clients/[id]/edit/page.tsx` until switched to API.

---

### 1.3 Catalogs – Suppliers
| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| GET    | `/catalogs/suppliers` | List suppliers | Entries new/edit (filtered by client) |
| GET    | `/catalogs/suppliers/search?q=` | Search suppliers | — |
| GET    | `/catalogs/suppliers/:id` | Get supplier by ID | — |
| POST   | `/catalogs/suppliers` | Create supplier | Catalogs suppliers new, entries (add supplier) |
| PUT    | `/catalogs/suppliers/:id` | Update supplier | — |
| DELETE | `/catalogs/suppliers/:id` | Delete supplier | — |

**Status:** Documented in API.md. Frontend still uses Supabase in `catalogs/suppliers/new/page.tsx`.

---

### 1.4 Catalogs – Carriers
| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| GET    | `/catalogs/carriers` | List carriers | Entries, load-orders new |
| GET    | `/catalogs/carriers/search?q=` | Search carriers | — |
| GET    | `/catalogs/carriers/:id` | Get carrier by ID | — |
| POST   | `/catalogs/carriers` | Create carrier | Catalogs carriers new |
| PUT    | `/catalogs/carriers/:id` | Update carrier | — |
| DELETE | `/catalogs/carriers/:id` | Delete carrier | — |

**Status:** Documented in API.md. Frontend still uses Supabase in `catalogs/carriers/new/page.tsx`.

---

### 1.5 Entries
| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| GET    | `/entries` | List entries (pagination, filters) | Entries list, inspections list, reports |
| GET    | `/entries/:id` | Get entry by ID (with relations) | Entry detail page |
| POST   | `/entries` | Create entry | Entries new |
| PUT    | `/entries/:id` | Update entry | Entries edit |
| PATCH  | `/entries/:id/status` | Update status | — |
| DELETE | `/entries/:id` | Delete entry | Entry actions |
| GET    | `/entries/:id/package-codes` | List package codes | Print labels dialog |
| POST   | `/entries/:id/package-codes/generate` | Generate package codes | (optional) |

**Status:** Documented in API.md and `API_BARCODE_PACKAGE_VERIFICATION.md`. Frontend still uses Supabase in `operations/entries/[id]/page.tsx` (full entry with relations and attachments). **Requirement:** `GET /entries/:id` must return (or allow expanding) **client, supplier, carrier, package_type, received_by (operator), and attachments** so the entry detail page can stop querying Supabase.

---

### 1.6 Entry Attachments (Not in API.md)
| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| POST   | `/entries/attachments` | Create attachment (entry_id, file_name, blob_url, etc.) | Entries new (after upload to blob) |

**Status:** Mentioned in `BACKEND_API_REQUIREMENTS.md` (included in POST entry). Frontend calls `api.post('/entries/attachments', { entry_id, file_name, blob_url, file_type, file_size })`. **Action:** Add to backend contract (request/response shape).

---

### 1.7 Load Orders
| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| GET    | `/load-orders` | List load orders (pagination, filters) | Load orders list, shipments, exits, dashboard |
| GET    | `/load-orders/:id` | Get load order by ID (with items) | Load order detail |
| POST   | `/load-orders` | Create load order with items | Load orders new |
| PUT    | `/load-orders/:id` | Update load order (and items) | Load orders edit |
| PATCH  | `/load-orders/:id` | Partial update (e.g. notes, economic_number) | Load order edit |
| PATCH  | `/load-orders/:id/status` | Update status (e.g. `completed`) | Load order detail/edit, ship |
| DELETE | `/load-orders/:id` | Delete load order | Load order detail |
| GET    | `/load-orders/:id/scan-verification` | Scan verification status | Scan verification panel |
| POST   | `/load-orders/:id/scan` | Record package scan | Scan verification panel |

**Status:** Documented in API.md and `API_BARCODE_PACKAGE_VERIFICATION.md`. **Requirement:** `GET /load-orders/:id` must include **items** (with `entry_id`, `packages_quantity`, `is_partial`, and nested **entries** with `entry_number`, `total_packages`) so the detail page does not need Supabase.

---

### 1.8 Special Entry Endpoints (Referenced in Code / BACKEND_API_REQUIREMENTS)
| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| GET    | `/entries/suppliers-by-client?client_id=` | Suppliers used by a client | Entries new/edit (supplier filter) |
| GET    | `/entries/available-for-load-order` | Entries with available packages | Load orders new |

**Status:** Listed in `BACKEND_API_REQUIREMENTS.md` as implemented. Frontend already uses them for load order new and entry forms.

---

### 1.9 Admin – Users
| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| GET    | `/admin/users` | List users (with email, profile) | Admin users list |
| GET    | `/admin/users/:id` | Get user by ID | Admin user edit |
| POST   | `/admin/users` | Create user (admin) | Admin new user |
| PUT    | `/admin/users/:id/role` | Update role | Admin user edit |
| PUT    | `/admin/users/:id/status` | Update is_active | Admin user edit |
| DELETE | `/admin/users/:id` | Delete user | Admin user |

**Status:** Documented in API.md and `BACKEND_USER_MANAGEMENT.md`. Frontend admin pages still call Next.js API routes that use Supabase; once backend implements these, frontend can call backend instead.

---

## 2. Documented in BACKEND_API_REQUIREMENTS but Not in API.md

These are required by the frontend or by BACKEND_API_REQUIREMENTS but are not fully specified in API.md.

### 2.1 Catalogs – Package Types
| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| GET    | `/catalogs/package-types` | List package types (active) | Entries new/edit, reports filters |

**Status:** Referenced in `BACKEND_API_REQUIREMENTS.md` under “Recommended New Backend APIs”. Frontend already calls `api.get('/catalogs/package-types')`. **Action:** Implement and add to API.md (response: array of `{ id, name, created_at }`).

---

### 2.2 Catalogs – Operators
| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| GET    | `/catalogs/operators` | List operators (e.g. for received_by) | Entries new/edit |

**Status:** Referenced in BACKEND_API_REQUIREMENTS. Frontend calls `api.get('/catalogs/operators')`. **Action:** Implement and add to API.md (e.g. list of user_profiles with operator-capable role or a dedicated “operators” list).

---

### 2.3 Revisions (Entry Revision)
| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| GET    | `/entries/:id/revision` | Get revision + items for entry | Inspections revision page |
| POST   | `/entries/:id/revision` | Create/update revision and items | Inspections revision page |

**Status:** In BACKEND_API_REQUIREMENTS as “Revisions API”. Frontend uses `api.get(`/entries/${entryId}/revision`)` and `api.post(`/entries/${entryId}/revision`, revisionData)`. **Action:** Document in API.md (request/response for revision + items, including all fields used in the revision form and Excel/email).

---

### 2.4 Password Reset – Confirm
| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| POST   | `/auth/confirm-reset` or `/auth/confirm-password-reset` | Set new password with token | Reset-password page |

**Status:** Not in API.md. Frontend calls `api.post('/auth/confirm-reset', { token, new_password })`. **Action:** Define in API.md (body, success/error responses).

---

## 3. Missing or Incomplete (Needed to Remove All Supabase Data Calls)

These are needed so that **every** remaining Supabase data call can be replaced by a backend call.

### 3.1 Dashboard
| Method | Path | Purpose | Used By |
|--------|------|---------|---------|
| GET    | `/dashboard` or equivalent | Recent open load orders + today’s entry count (role/client filtered) | `app/page.tsx` (dashboard) |

**Current:** `app/page.tsx` uses Supabase for `user_profiles`, then `load_orders` (status pendiente, limit 5) and `entries` (entry_date = today, count).  
**Required:** One endpoint (e.g. `GET /dashboard`) that returns `{ openLoadOrders: [...], todayEntriesCount: number }` with backend applying role/client_id filter. Document in API.md.

---

### 3.2 Entry Detail – Single Request with Relations
**Current:** `operations/entries/[id]/page.tsx` uses Supabase for:
- Entry + clients, suppliers
- carriers (if carrier_id)
- package_types (if package_type_id)
- users (received_by)
- entry_attachments

**Required:** `GET /entries/:id` must support optional expand or always return:
- `client`, `supplier`, `carrier`, `package_type`, `received_by` (or equivalent), and `attachments` (array of `{ id, file_name, blob_url, file_type, file_size, created_at }`).

Document the exact response shape in API.md so the entry detail page can use a single GET and drop Supabase.

---

### 3.3 Load Order Detail – With Items
**Current:** Load order detail page uses backend `GET /load-orders/:id` but expects `data.items` with nested `entries.entry_number`, `entries.total_packages`.

**Required:** Already in API.md; ensure backend returns `items[]` with `entry_id`, `packages_quantity`, `is_partial`, and nested `entries: { entry_number, total_packages }` (or equivalent). No additional endpoint needed if response shape matches.

---

### 3.4 Reports (Single Page – Multiple Data Sets)
**Current:** `app/reports/page.tsx` (client) uses Supabase for:
- **Initial:** `clients` (active), `package_types` (active)
- **Inventory:** `entries` (status recibido, with relations) + `load_order_items` + `load_orders` (status salida) to compute available/shipped
- **Entries report:** `entries` with filters (client, dates, package type)
- **Exits report:** `load_orders` + `load_order_items` with filters
- **Performance:** `entries` (entry_date, total_packages, total_weight), `load_orders` (created_at, total_packages), client/supplier/carrier counts

**Required:** Either:

- **Option A (preferred):** Dedicated report endpoints, e.g.  
  - `GET /reports/inventory?client_id=&...`  
  - `GET /reports/entries?client_id=&start_date=&end_date=&package_type=&...`  
  - `GET /reports/exits?client_id=&start_date=&end_date=&package_type=&...`  
  - `GET /reports/performance?start_date=&end_date=`  
  plus `GET /catalogs/clients`, `GET /catalogs/package-types` for filters (already in API.md / 2.1).

- **Option B:** Keep using existing `GET /entries` and `GET /load-orders` with strong filtering and let the frontend compute aggregates (heavier client-side and more round-trips).

Document chosen option and response shapes in API.md or a short “Reports” section.

---

### 3.5 Shipments Page
**Current:** `operations/shipments/page.tsx` (server) uses Supabase: `load_orders` with status filter (e.g. salida/shipped).

**Required:** Use `GET /load-orders?status=completed` (or the status value used for “shipped”). No new endpoint if list endpoint supports `status` filter (already in API.md).

---

### 3.6 Exits Page
**Current:** `operations/exits/page.tsx` (server) uses Supabase: `load_orders` (likely status = salida/completed).

**Required:** Same as 3.5: `GET /load-orders?status=completed`. No new endpoint if filter is supported.

---

### 3.7 Inspections List
**Current:** `operations/inspections/page.tsx` (server) uses Supabase: `entries` with filters (e.g. has_invoice, status).

**Required:** Use `GET /entries` with appropriate query params (e.g. `has_invoice`, `status`) if backend supports them. If not, add optional filters to `GET /entries` and document them.

---

### 3.8 Inspections Entry Status Updates
**Current:** `operations/inspections/[id]/page.tsx` (client) uses Supabase: `entries` select and update (has_invoice, has_revision, has_classification).

**Required:** Use `GET /entries/:id` and `PUT /entries/:id` (or `PATCH`) with fields `has_invoice`, `has_revision`, `has_classification`. No new endpoint if PUT/PATCH accepts these fields (add to API.md if missing).

---

### 3.9 Client Detail (Read)
**Current:** `catalogs/clients/[id]/page.tsx` (server) uses Supabase: `clients` by id.

**Required:** Use `GET /catalogs/clients/:id`. Already in API.md.

---

### 3.10 Client Create / Update (Catalogs)
**Current:**  
- `catalogs/clients/new/page.tsx`: Supabase `clients.insert`.  
- `catalogs/clients/[id]/edit/page.tsx`: Supabase `clients.select` and `clients.update`.

**Required:** Use `POST /catalogs/clients` and `PUT /catalogs/clients/:id`. Already in API.md.

---

### 3.11 Supplier Create
**Current:** `catalogs/suppliers/new/page.tsx`: Supabase `suppliers.insert`.

**Required:** Use `POST /catalogs/suppliers`. Already in API.md.

---

### 3.12 Carrier Create
**Current:** `catalogs/carriers/new/page.tsx`: Supabase `carriers.insert`.

**Required:** Use `POST /catalogs/carriers`. Already in API.md.

---

## 4. Summary Table – Backend vs Frontend

| Area | Backend Endpoint(s) | In API.md? | Frontend Still Using Supabase? |
|------|----------------------|------------|---------------------------------|
| Auth | POST signin, signout, GET me, etc. | Yes | No (migrated) |
| Clients | GET/POST/PUT/DELETE /catalogs/clients | Yes | Yes (detail, new, edit) |
| Suppliers | GET/POST/PUT/DELETE /catalogs/suppliers | Yes | Yes (new) |
| Carriers | GET/POST/PUT/DELETE /catalogs/carriers | Yes | Yes (new) |
| Package types | GET /catalogs/package-types | No | No (uses API) |
| Operators | GET /catalogs/operators | No | No (uses API) |
| Entries | GET/POST/PUT/DELETE /entries, GET /entries/:id | Yes | Yes (detail page – relations + attachments) |
| Entry attachments | POST /entries/attachments | No | No (uses API) |
| Entries by client/suppliers | GET /entries/suppliers-by-client, available-for-load-order | In BACKEND_API_REQUIREMENTS | No (uses API) |
| Load orders | GET/POST/PUT/PATCH/DELETE /load-orders, scan, scan-verification | Yes | No (detail uses API; ensure items in response) |
| Revisions | GET/POST /entries/:id/revision | In BACKEND_API_REQUIREMENTS only | No (uses API) |
| Admin users | GET/POST/PUT/DELETE /admin/users, role, status | Yes + BACKEND_USER_MANAGEMENT | Yes (via Next.js API routes) |
| Dashboard | — | No | Yes (page.tsx) |
| Reports | — | No | Yes (reports/page.tsx) |
| Shipments | GET /load-orders?status= | Yes (list) | Yes (server component) |
| Exits | GET /load-orders?status= | Yes (list) | Yes (server component) |
| Inspections list | GET /entries?… | Yes (list) | Yes (server component) |
| Inspections [id] | GET/PUT /entries/:id | Yes | Yes (client component) |
| Password confirm reset | POST /auth/confirm-reset | No | No (calls API) |

---

## 5. Recommended Backend Additions / Doc Updates

1. **API.md**
   - Add: `GET /catalogs/package-types`, `GET /catalogs/operators`.
   - Add: `POST /entries/attachments` (body and response).
   - Add: `POST /auth/confirm-reset` (or equivalent name) for password reset with token.
   - Specify: `GET /entries/:id` response includes relations (client, supplier, carrier, package_type, received_by) and `attachments[]`.
   - Specify: `GET /load-orders/:id` response includes `items[]` with nested entry info.
   - Add: Revisions – `GET /entries/:id/revision`, `POST /entries/:id/revision` (payload and response).
   - Add: Dashboard – `GET /dashboard` (or equivalent) returning open load orders and today’s entry count.
   - Add: Reports – either dedicated endpoints (`GET /reports/inventory`, `/reports/entries`, `/reports/exits`, `/reports/performance`) or document usage of existing list endpoints with filters.

2. **Backend implementation**
   - Implement any of the above that are still missing (package-types, operators, confirm-reset, dashboard, report endpoints or documented filter usage).
   - Ensure `GET /entries/:id` and `GET /load-orders/:id` return the shapes required above so the frontend can remove all remaining Supabase data calls.

3. **Frontend migration (after backend is ready)**
   - Replace Supabase in: `app/page.tsx`, `app/reports/page.tsx`, `operations/entries/[id]/page.tsx`, `operations/shipments/page.tsx`, `operations/exits/page.tsx`, `operations/inspections/page.tsx`, `operations/inspections/[id]/page.tsx`, `catalogs/clients/[id]/page.tsx`, `catalogs/clients/new/page.tsx`, `catalogs/clients/[id]/edit/page.tsx`, `catalogs/suppliers/new/page.tsx`, `catalogs/carriers/new/page.tsx`.
   - Optionally migrate admin user management from Next.js API routes to direct backend calls (see `BACKEND_USER_MANAGEMENT.md`).

---

## 6. References

- **API.md** – Main backend API contract (auth, catalogs, entries, load orders, admin).
- **API_BARCODE_PACKAGE_VERIFICATION.md** – Package codes and scan verification.
- **BACKEND_API_REQUIREMENTS.md** – Next.js API and migration notes; package-types, operators, revisions, reports, dashboard.
- **BACKEND_USER_MANAGEMENT.md** – Admin user endpoints and behavior.
- **AUTHENTICATION.md** – App auth layers (middleware, server auth, CASL); now uses backend for auth.
