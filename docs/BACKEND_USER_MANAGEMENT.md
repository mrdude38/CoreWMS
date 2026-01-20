# Backend User Management API - Implementation Specification

This document describes the admin user management endpoints that need to be implemented in the Go backend to support the frontend admin features.

## Overview

The frontend requires endpoints for administrators to:
1. Create users directly (bypassing email verification)
2. List users with their email addresses
3. Update user profiles
4. Deactivate/reactivate users

Currently, the frontend uses a Next.js API route (`/api/admin/users`) that calls Supabase directly. These endpoints should be moved to the Go backend for consistency and security.

---

## Required Endpoints

### 1. Create User (Admin)

**Endpoint:** `POST /api/v1/admin/users`

**Description:** Create a new user account directly, optionally skipping email verification. This is used by administrators to onboard users without requiring them to go through the self-registration flow.

**Required Role:** `admin`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "role": "operator",
  "client_id": "uuid-of-client",
  "skip_email_verification": true
}
```

**Field Specifications:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email address, must be unique |
| `password` | string | Yes | Minimum 8 characters |
| `full_name` | string | Yes | User's display name |
| `role` | string | Yes | One of: `admin`, `manager`, `operator`, `viewer`, `client` |
| `client_id` | uuid | Conditional | Required if role is `client`, must reference valid client |
| `skip_email_verification` | boolean | No | Default: `true`. If true, user can log in immediately |

**Success Response (201):**
```json
{
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "operator",
    "client_id": null,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `"Missing required fields"` | Required fields not provided |
| 400 | `"Invalid role"` | Role not in allowed list |
| 400 | `"Client ID required for client role"` | Role is client but no client_id |
| 400 | `"Email already exists"` | User with email already registered |
| 400 | `"Password too short"` | Password less than 8 characters |
| 401 | `"Unauthorized"` | No valid auth token |
| 403 | `"Forbidden"` | User is not an admin |
| 404 | `"Client not found"` | Provided client_id doesn't exist |

**Implementation Notes:**

1. Use Supabase Admin API (`supabase.auth.admin.createUser()`) to create the auth user
2. Set `email_confirm: true` when `skip_email_verification` is true
3. Create the `user_profiles` record with the provided role and client_id
4. If profile creation fails, rollback by deleting the auth user
5. Store `full_name`, `role`, and `client_id` in user metadata for the trigger fallback

---

### 2. List Users with Email (Enhanced)

**Endpoint:** `GET /api/v1/admin/users`

**Description:** List all users with their email addresses and profile information. The current endpoint exists but may not include email (which is in auth.users, not user_profiles).

**Required Role:** `admin`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `page_size` | integer | Items per page (default: 20, max: 100) |
| `role` | string | Filter by role |
| `is_active` | boolean | Filter by active status |
| `search` | string | Search in full_name or email |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "email_confirmed": true,
      "full_name": "John Doe",
      "role": "operator",
      "client_id": "uuid",
      "client": {
        "id": "uuid",
        "name": "Acme Corp"
      },
      "is_active": true,
      "last_sign_in": "2024-01-14T08:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-10T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

**Implementation Notes:**

1. Join `user_profiles` with auth.users data (requires admin API)
2. Use `supabase.auth.admin.listUsers()` to get email and auth metadata
3. Merge with profile data from `user_profiles` table
4. Include `email_confirmed` and `last_sign_in` from auth data

---

### 3. Update User Profile (Enhanced)

**Endpoint:** `PUT /api/v1/admin/users/:id`

**Description:** Update a user's profile including role, client assignment, and active status. Consolidates the separate role/status endpoints into one.

**Required Role:** `admin`

**Request Body:** (all fields optional)
```json
{
  "full_name": "John Smith",
  "role": "manager",
  "client_id": "uuid-or-null",
  "is_active": true
}
```

**Field Specifications:**

| Field | Type | Description |
|-------|------|-------------|
| `full_name` | string | Update display name |
| `role` | string | Must be valid role |
| `client_id` | uuid/null | Set to null to remove client association |
| `is_active` | boolean | Deactivate/reactivate user |

**Success Response (200):**
```json
{
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "full_name": "John Smith",
    "role": "manager",
    "client_id": null,
    "is_active": true,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `"Invalid role"` | Role not in allowed list |
| 400 | `"Cannot change own role"` | Admin trying to demote themselves |
| 401 | `"Unauthorized"` | No valid auth token |
| 403 | `"Forbidden"` | User is not an admin |
| 404 | `"User not found"` | User ID doesn't exist |

**Implementation Notes:**

1. Prevent admins from changing their own role (security measure)
2. If changing to `client` role, require `client_id`
3. If changing from `client` role, optionally clear `client_id`
4. Update `updated_at` timestamp

---

### 4. Delete User

**Endpoint:** `DELETE /api/v1/admin/users/:id`

**Description:** Permanently delete a user account. This removes both the auth user and profile.

**Required Role:** `admin`

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `"Cannot delete own account"` | Admin trying to delete themselves |
| 401 | `"Unauthorized"` | No valid auth token |
| 403 | `"Forbidden"` | User is not an admin |
| 404 | `"User not found"` | User ID doesn't exist |

**Implementation Notes:**

1. Prevent admins from deleting their own account
2. Delete auth user first using `supabase.auth.admin.deleteUser()`
3. Profile should cascade delete or be deleted explicitly
4. Consider soft-delete (is_active = false) as alternative

---

### 5. Reset User Password (Admin)

**Endpoint:** `POST /api/v1/admin/users/:id/reset-password`

**Description:** Set a new password for a user directly, or send them a password reset email.

**Required Role:** `admin`

**Request Body:**
```json
{
  "new_password": "newSecurePassword123",
  "send_email": false
}
```

**Field Specifications:**

| Field | Type | Description |
|-------|------|-------------|
| `new_password` | string | Set password directly (if provided) |
| `send_email` | boolean | Send password reset email instead |

*Note: Provide either `new_password` OR set `send_email: true`, not both.*

**Success Response (200):**
```json
{
  "message": "Password updated successfully"
}
```
or
```json
{
  "message": "Password reset email sent"
}
```

**Implementation Notes:**

1. If `new_password` provided, use `supabase.auth.admin.updateUserById()` with new password
2. If `send_email` is true, use `supabase.auth.resetPasswordForEmail()`
3. Validate password minimum length (8 characters)

---

## Database Schema Reference

### user_profiles table

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'operator', 'viewer', 'client')),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Supabase Admin API Reference

The backend will need to use the Supabase Admin API (service role key) for these operations:

```go
// Initialize admin client
adminClient := supabase.CreateClient(supabaseURL, serviceRoleKey)

// Create user
adminClient.Auth.Admin.CreateUser(AdminUserAttributes{
    Email:        email,
    Password:     password,
    EmailConfirm: true, // Skip email verification
    UserMetadata: map[string]interface{}{
        "full_name": fullName,
        "role":      role,
    },
})

// List users
adminClient.Auth.Admin.ListUsers()

// Update user
adminClient.Auth.Admin.UpdateUserById(userID, AdminUserAttributes{
    Password: newPassword,
})

// Delete user
adminClient.Auth.Admin.DeleteUser(userID)
```

---

## Security Considerations

1. **Admin-only access:** All endpoints require `admin` role verification
2. **Self-modification prevention:** Admins cannot change their own role or delete themselves
3. **Service role key:** Must be stored securely, never exposed to frontend
4. **Audit logging:** Consider logging all admin user actions
5. **Rate limiting:** Apply rate limits to prevent abuse

---

## Migration Path

Once these backend endpoints are implemented:

1. Update frontend `src/app/admin/users/new/page.tsx` to call backend API
2. Remove Next.js API route `src/app/api/admin/users/route.ts`
3. Update admin users list page to use backend API for email data
4. Test all CRUD operations

---

## Testing Checklist

- [ ] Create user with all roles
- [ ] Create client-role user with client_id
- [ ] Attempt to create user with existing email (should fail)
- [ ] List users with pagination
- [ ] Filter users by role and active status
- [ ] Search users by name and email
- [ ] Update user role
- [ ] Update user active status
- [ ] Attempt self-role-change (should fail)
- [ ] Delete user
- [ ] Attempt self-deletion (should fail)
- [ ] Reset password directly
- [ ] Send password reset email
