# Authentication & Authorization Guide

This document explains how authentication and authorization are centralized and handled throughout the CoreWMS application.

## Overview

The application uses a **layered authentication and authorization approach**:

1. **Middleware** - Handles authentication (is user logged in?)
2. **Server Auth Utilities** - Provides centralized access to user data
3. **CASL Guards** - Handles authorization (permissions/roles)

## Architecture

### Layer 1: Middleware (Authentication)

**File**: [middleware.ts](../middleware.ts) and [src/lib/supabase/proxy.ts](../src/lib/supabase/proxy.ts)

**Responsibility**: Verify that users are authenticated before accessing protected routes.

**What it does**:
- Runs on **every request** before the page loads
- Checks if the user has a valid session cookie
- Redirects unauthenticated users to `/auth/login`
- Redirects authenticated users away from auth pages (login, signup, etc.)
- Enforces role-based access for `/admin/*` routes

**Public routes** (no authentication required):
- `/auth/login`
- `/auth/signup`
- `/auth/forgot-password`
- `/auth/callback`
- `/auth/reset-password`

All other routes require authentication.

**Example**: If a user tries to access `/operations/entries` without being logged in, middleware redirects them to `/auth/login?redirect=/operations/entries`.

### Layer 2: Server Auth Utilities

**File**: [src/lib/auth/server-auth.ts](../src/lib/auth/server-auth.ts)

**Responsibility**: Provide centralized, reusable functions to access authenticated user data in Server Components.

**Available Functions**:

#### `getCurrentUser()`
Returns the current authenticated user or `null`.

```typescript
import { getCurrentUser } from '@/lib/auth/server-auth'

async function MyComponent() {
  const user = await getCurrentUser()
  // user can be null (shouldn't happen on protected routes due to middleware)
}
```

#### `requireUser()`
Returns the current authenticated user or throws an error. Use this when you need a guaranteed non-null user.

```typescript
import { requireUser } from '@/lib/auth/server-auth'

async function MyComponent() {
  const user = await requireUser() // TypeScript knows user is never null
  console.log(user.email)
}
```

#### `getCurrentUserProfile()`
Returns the user's profile from the database or `null`.

```typescript
import { getCurrentUserProfile } from '@/lib/auth/server-auth'

async function MyComponent() {
  const profile = await getCurrentUserProfile()
  // profile contains: id, full_name, role, is_active, etc.
}
```

**When to use**: In Server Components when you need the current user's data but don't need to check permissions.

### Layer 3: CASL Guards (Authorization)

**Files**:
- [src/lib/casl/server-guards.ts](../src/lib/casl/server-guards.ts) - Guard functions
- [src/lib/casl/server-ability.ts](../src/lib/casl/server-ability.ts) - Ability creation
- [src/lib/casl/factory.ts](../src/lib/casl/factory.ts) - Permission definitions

**Responsibility**: Check if the authenticated user has permission to perform specific actions.

**Available Guards**:

#### `requirePermission(action, subject)`
Requires a specific permission to access the page. Redirects to `/` if permission is denied.

```typescript
import { requirePermission } from '@/lib/casl/server-guards'

async function getEntries() {
  await requirePermission('read', 'Entry')

  // User is authenticated (middleware) AND has permission to read entries
  const supabase = await createClient()
  const { data } = await supabase.from('entries').select('*')
  return data
}
```

**Available actions**: `'read'`, `'create'`, `'update'`, `'delete'`, `'manage'`

**Available subjects**: `'Catalog'`, `'Entry'`, `'LoadOrder'`, `'Report'`, `'User'`, `'Email'`, `'all'`

#### `requireAdmin()`
Requires admin role to access the page. Redirects to `/` if user is not an admin.

```typescript
import { requireAdmin } from '@/lib/casl/server-guards'

async function getUsers() {
  await requireAdmin()

  // User is authenticated AND is an admin
  const supabase = await createClient()
  const { data } = await supabase.from('user_profiles').select('*')
  return data
}
```

## Role-Based Permissions

The application supports 5 roles with different permission levels:

### Admin
- Full access to everything
- Can manage users
- Can access `/admin/*` routes

### Manager
- Read, create, update: Catalogs, Entries, Load Orders
- Can delete Load Orders
- Can read Reports and Users
- Can create Emails

### Operator
- Read: Catalogs
- Read, create, update: Entries, Load Orders (no delete)
- Can read Reports and Emails

### Viewer
- Read-only access to: Catalogs, Entries, Load Orders, Reports

### Client
- Read: Catalogs, Entries, Reports
- Read, create: Load Orders
- **Data is filtered to only show their own records** (via `client_id`)

## Best Practices

### ✅ DO: Let Middleware Handle Authentication

**Bad** (redundant):
```typescript
async function getDashboardData() {
  const supabase = await createClient()

  // ❌ Don't do this - middleware already checked!
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // ... fetch data
}
```

**Good**:
```typescript
async function getDashboardData() {
  const supabase = await createClient()

  // ✅ No auth check needed - middleware handles it
  // ... fetch data directly
}
```

### ✅ DO: Use CASL Guards for Authorization

**When to use**:
- When a page should only be accessible to users with specific permissions
- When you need role-based access control

**Example**:
```typescript
import { requirePermission } from '@/lib/casl/server-guards'

async function getClients() {
  await requirePermission('read', 'Catalog')

  const supabase = await createClient()
  const { data } = await supabase.from('clients').select('*')
  return data
}
```

### ✅ DO: Use Centralized Auth Utilities

**When to use**:
- When you need to get the current user's info in a Server Component
- When you need the user's profile data

**Example**:
```typescript
import { requireUser, getCurrentUserProfile } from '@/lib/auth/server-auth'

async function getUserProfile() {
  const user = await requireUser()
  const profile = await getCurrentUserProfile()

  return { user, profile }
}
```

### ❌ DON'T: Add Auth Checks to Individual Pages

Since middleware handles authentication, you should **not** add manual auth checks in pages:

```typescript
// ❌ Don't do this
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth/login')

// ✅ Trust that middleware already handled it
```

### ❌ DON'T: Confuse Authentication with Authorization

- **Authentication** = "Who are you?" → Handled by **middleware**
- **Authorization** = "What can you do?" → Handled by **CASL guards**

## API Routes

For API routes (e.g., `/api/emails/send`), you still need to check authentication manually since middleware only handles Next.js pages:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerAbility } from '@/lib/casl/server-ability'

export async function POST(request: NextRequest) {
  // 1. Verify authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Check permissions
  const ability = await getServerAbility()
  if (!ability.can('create', 'Email')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // 3. Process request
  // ...
}
```

## Flow Diagram

```
USER REQUEST
    ↓
MIDDLEWARE (middleware.ts)
    ├─ Is session valid?
    ├─ Is route public?
    ├─ Is user trying to access /admin?
    └─ Redirect if needed
    ↓
PAGE/SERVER COMPONENT
    ├─ Use CASL guards for authorization (if needed)
    │   └─ requirePermission('read', 'Entry')
    ├─ Use auth utilities to get user data (if needed)
    │   └─ getCurrentUser(), getCurrentUserProfile()
    └─ Fetch and render data
    ↓
RENDER
```

## Migration from Old Pattern

If you find old authentication checks in pages, replace them:

### Before:
```typescript
async function getData() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // ... fetch data
}
```

### After:
```typescript
async function getData() {
  const supabase = await createClient()

  // No auth check needed - middleware handles it!
  // ... fetch data
}
```

Or if you need user data:

```typescript
import { requireUser } from '@/lib/auth/server-auth'

async function getData() {
  const user = await requireUser()
  const supabase = await createClient()

  // ... fetch data using user.id
}
```

## Summary

1. **Middleware** handles authentication globally - no need to check in pages
2. **Server Auth Utilities** provide centralized access to user data
3. **CASL Guards** handle authorization (permissions/roles)
4. **Trust the layers** - don't duplicate checks
5. **Keep it DRY** - use the provided utilities instead of manual checks
