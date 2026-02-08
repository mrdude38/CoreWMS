# API Guide: Barcode / Package Verification (Frontend)

This document describes the backend API for the **Barcode/QR Code System for Package Verification**. Use it to wire the frontend to each feature.

**Base URL:** `/api/v1`  
**Auth:** All endpoints require `Authorization: Bearer <access_token>`.

---

## Feature 1: Entry received → package codes available

When an entry is **received**, the backend generates one package code per package (e.g. `ENT-0020-001`, `ENT-0020-002`, …).

### How codes are created (no extra frontend call needed)

- **Create entry** with `status: "received"` and `total_packages > 0`  
  → Backend creates package codes automatically after the entry is saved.

- **Update entry** and set `status` to `"received"` with `total_packages > 0`  
  → Backend creates package codes automatically if the entry has none yet.

**Calls you already make:**

| Action | Method | Path | Body (relevant fields) |
|--------|--------|------|------------------------|
| Create entry as received | `POST` | `/entries` | `{ "entry_number": "...", "entry_date": "...", "total_packages": N, "status": "received", ... }` |
| Update entry to received | `PUT` | `/entries/:id` | `{ "status": "received", "total_packages": N, ... }` |

After a successful create/update, codes exist. Use **Feature 2** to load them for labels.

### Optional: generate codes manually

If the frontend needs to trigger code generation explicitly (e.g. “Generate codes” button):

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/entries/:id/package-codes/generate` | (none) | `201`: `{ "message": "Package codes generated", "data": { "codes": [...], "count": N } }` or `200`: `{ "message": "Package codes already exist", "data": { "count": N } }` |

**Errors:** `400` if entry is not `received` or has no packages.

---

## Feature 2: Print labels (list package codes for an entry)

To show or print labels (QR + barcode) for an entry, load its package codes.

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/entries/:id/package-codes` | `200`: `{ "data": [ { "id", "entry_id", "package_number", "code", "status", "assigned_load_order_id", "created_at" }, ... ] }` |

**Example code object:**

```json
{
  "id": "uuid",
  "entry_id": "uuid",
  "package_number": 1,
  "code": "ENT-0020-001",
  "status": "available",
  "assigned_load_order_id": null,
  "created_at": "2026-02-07T12:00:00Z"
}
```

**`status`:** `"available"` | `"assigned"` | `"shipped"`. Use `code` for QR/barcode and label text.

---

## Feature 3: Create load order → package codes assigned

When the user creates a load order **with items** (entries + package quantities), the backend assigns that many **available** package codes from each entry to the load order.

**Call you already make:**

| Method | Path | Body (relevant) |
|--------|------|------------------|
| `POST` | `/load-orders` | `{ "order_number": "...", "total_packages": N, "items": [ { "entry_id": "uuid", "packages_quantity": 2, "is_partial": false }, ... ], ... }` |

**Backend behavior:**

- For each `item`, the backend takes up to `packages_quantity` **available** codes for that `entry_id` and sets `assigned_load_order_id` to the new load order and `status` to `"assigned"`.
- If an entry does not have enough **available** codes, the API returns **400** with a message like:  
  `"entry <id> has only X available package code(s), need Y"`.

**Frontend:** Ensure entries are received and have enough packages (and codes) before creating the load order; show this error if the backend returns 400.

---

## Feature 4: Update load order items → codes re-assigned

When the user edits a load order and **changes items** (entries or quantities), the backend:

1. Unassigns all package codes that were assigned to this load order.
2. Saves the new items.
3. Assigns available codes again (same rule as create: per item, up to `packages_quantity` from that entry).
4. Resets scan verification for the load order (`scan_verified` = false).

**Call you already make:**

| Method | Path | Body (relevant) |
|--------|------|------------------|
| `PUT` | `/load-orders/:id` | `{ "items": [ { "entry_id": "uuid", "packages_quantity": N, "is_partial": false }, ... ], ... }` |

Same 400 rule as create if an entry has insufficient available codes.

---

## Feature 5: Scan verification panel (progress + “can ship”)

Use this to show: how many packages are assigned, how many are scanned, and whether the user can ship.

### Get verification status

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/load-orders/:id/scan-verification` | `200`: `{ "data": { "load_order_id", "scan_verified", "scan_verified_at", "assigned_count", "scanned_count", "pending_count", "can_ship" } }` |

**Example:**

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

- **assigned_count:** Packages assigned to this load order (from items).
- **scanned_count:** Packages that have been scanned for this load order.
- **pending_count:** `assigned_count - scanned_count`.
- **scan_verified:** `true` when every assigned package has been scanned (backend sets this automatically when the last scan is recorded).
- **can_ship:** `true` when the load order can be shipped (either `scan_verified` is true or there are no assigned packages).

**Frontend:** Poll or refetch after each scan; use `scan_verified` or `can_ship` to enable/disable the “Ship” / “Mark as salida” action and to show progress (e.g. “3/10 scanned”).

---

## Feature 6: Record a scan (barcode/QR scanner)

When the user (or a hardware scanner) scans a package code, send it to the backend so it’s counted toward verification.

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/load-orders/:id/scan` | `{ "scanned_code": "ENT-0020-001" }` | `201`: `{ "message": "Scan recorded", "data": { "scanned_code": "ENT-0020-001" } }` or `200`: `{ "message": "Already scanned", "data": { "scanned_code": "..." } }` |

**Errors:**

- **400** – Invalid or unknown code, or code not assigned to this load order.  
  Example: `{ "error": "This package is not assigned to this load order" }`.

**Backend:** When the number of scans equals the number of assigned packages, the backend sets `scan_verified` and `scan_verified_at` on the load order. The next `GET /load-orders/:id/scan-verification` will show `can_ship: true`.

**Frontend:** After each successful `POST`, refetch scan verification (Feature 5) to update the UI; optionally play a success sound for “Scan recorded” and a different feedback for “Already scanned”.

---

## Feature 7: Ship load order (mark as salida / completed)

The user may only ship (set status to completed/salida) when either:

- There are **no** assigned packages, or  
- **All** assigned packages have been scanned (`scan_verified` = true).

**Call you already make:**

| Method | Path | Body |
|--------|------|------|
| `PATCH` | `/load-orders/:id/status` | `{ "status": "completed" }` |

**Backend:**

- If the load order has assigned packages and `scan_verified` is false → **400**  
  Body example: `{ "error": "All packages must be scanned before shipping. Complete scan verification first." }`
- If the request is allowed, the backend marks the assigned package codes as `shipped` and updates the load order status.

**Frontend:**

- Disable the “Ship” / “Mark as salida” button when `can_ship` is false (from Feature 5).
- If you still send `PATCH .../status` with `"completed"` when not verified, show the 400 error message to the user.

---

## Load order response: new fields

When you fetch a single load order (`GET /load-orders/:id`), the object now includes:

| Field | Type | Description |
|-------|------|-------------|
| `scan_verified` | boolean | `true` when all assigned packages have been scanned. |
| `scan_verified_at` | string (ISO datetime) or null | When verification was completed. |

Use these to show a “Verified” badge or to pre-enable/disable Ship without an extra call to scan-verification if you already have the load order.

---

## Quick reference: which API for which UI

| UI / Action | API to call |
|-------------|-------------|
| Create/update entry as received | `POST /entries` or `PUT /entries/:id` (codes created automatically). |
| “Generate codes” button (optional) | `POST /entries/:id/package-codes/generate` |
| Print labels – get codes for entry | `GET /entries/:id/package-codes` |
| Create load order with items | `POST /load-orders` with `items` (codes assigned automatically). |
| Update load order items | `PUT /load-orders/:id` with `items` (codes re-assigned; verification reset). |
| Scan verification panel (counts, can ship) | `GET /load-orders/:id/scan-verification` |
| User/scanner scans a code | `POST /load-orders/:id/scan` with `{ "scanned_code": "ENT-0020-001" }` |
| Ship / Mark as salida | `PATCH /load-orders/:id/status` with `{ "status": "completed" }` (block in UI when `can_ship` is false). |
| Load order detail (includes verified flag) | `GET /load-orders/:id` (includes `scan_verified`, `scan_verified_at`). |

---

## Status mapping (backend ↔ frontend)

Backend uses **English** status values; frontend may show Spanish labels:

| Backend (entry) | Frontend display (example) |
|-----------------|----------------------------|
| `pending` | Pendiente |
| `received` | Recibido |

| Backend (load order) | Frontend display (example) |
|----------------------|----------------------------|
| `open` | Abierto |
| `in_progress` | En progreso |
| `completed` | Salida / Shipped |
| `cancelled` | Cancelado |

| Backend (package code status) | Meaning |
|-------------------------------|--------|
| `available` | Not in any load order. |
| `assigned` | In a load order, not yet shipped. |
| `shipped` | Load order was completed; code is shipped. |
