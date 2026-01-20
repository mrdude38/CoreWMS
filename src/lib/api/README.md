# CoreWMS API Client

This module provides a client library for communicating with the CoreWMS Go backend.

## Configuration

Add the following environment variable to your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For production:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## Usage

### Client-side (React Components)

```tsx
"use client"

import { clientsApi, entriesApi } from '@/lib/api';

// In a component
const loadClients = async () => {
  const response = await clientsApi.getAll();
  if (response.error) {
    console.error(response.error);
    return;
  }
  setClients(response.data || []);
};
```

### Server-side (Server Components)

```tsx
import { createServerServices } from '@/lib/api/server';

async function getClients() {
  const { clients } = createServerServices();
  const response = await clients.getAll();
  
  if (response.error) {
    console.error('Failed to fetch clients:', response.error);
    return [];
  }
  
  return response.data || [];
}
```

## Available Services

### Client-side
- `clientsApi` - Client management
- `suppliersApi` - Supplier management
- `carriersApi` - Carrier management
- `entriesApi` - Entry management
- `loadOrdersApi` - Load order management
- `authApi` - Authentication

### Server-side (via `createServerServices()`)
- `clients` - Client management
- `suppliers` - Supplier management
- `carriers` - Carrier management
- `entries` - Entry management
- `loadOrders` - Load order management

## API Methods

Each service provides these methods:

### Catalogs (clients, suppliers, carriers)
- `getAll(options?)` - Get all items
- `getById(id)` - Get single item
- `search(query)` - Search by name
- `create(data)` - Create new item
- `update(id, data)` - Update item
- `delete(id)` - Delete item

### Operations (entries, loadOrders)
- `getAll(filters?)` - Get all with pagination and filters
- `getById(id)` - Get single item
- `create(data)` - Create new item
- `update(id, data)` - Update item
- `updateStatus(id, status)` - Update status
- `delete(id)` - Delete item

### Auth
- `signIn(credentials)` - Sign in
- `signUp(data)` - Sign up
- `signOut()` - Sign out
- `refreshToken(token)` - Refresh access token
- `getCurrentUser()` - Get current user and profile
- `resetPassword(email)` - Request password reset
