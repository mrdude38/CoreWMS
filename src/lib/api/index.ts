// Client-side API
export { api, apiClient, type ApiResponse, type PaginatedResponse } from './client';

// Configuration
export { API_BASE_URL, getApiUrl } from './config';

// Services - Client side
import { api } from './client';
import { createClientService } from './services/clients';
import { createSupplierService } from './services/suppliers';
import { createCarrierService } from './services/carriers';
import { createEntryService } from './services/entries';
import { createLoadOrderService } from './services/load-orders';

// Pre-configured client-side services
export const clientsApi = createClientService(api);
export const suppliersApi = createSupplierService(api);
export const carriersApi = createCarrierService(api);
export const entriesApi = createEntryService(api);
export const loadOrdersApi = createLoadOrderService(api);

// Auth API
export { authApi } from './services/auth';

// NOTE: Server-side API should be imported directly from '@/lib/api/server'
// to avoid bundling server-only code with client components.
// Example: import { serverApi, createServerServices } from '@/lib/api/server';
