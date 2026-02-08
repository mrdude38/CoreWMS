import { cookies } from 'next/headers';
import { getApiUrl } from './config';

const AUTH_COOKIE = 'corewms_access_token';
import { createClientService } from './services/clients';
import { createSupplierService } from './services/suppliers';
import { createCarrierService } from './services/carriers';
import { createEntryService } from './services/entries';
import { createLoadOrderService } from './services/load-orders';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

// Get the access token from auth cookie (set after backend login)
async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value ?? null;
}

// Server-side API fetch function
export async function apiServer<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, params, headers = {} } = options;

  // Build URL with query parameters
  let url = getApiUrl(endpoint);
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Get auth token
  const token = await getAccessToken();

  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    fetchHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers: fetchHeaders,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store', // Disable caching for server components
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || `HTTP error ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Convenience methods for server-side
export const serverApi = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiServer<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown) =>
    apiServer<T>(endpoint, { method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown) =>
    apiServer<T>(endpoint, { method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown) =>
    apiServer<T>(endpoint, { method: 'PATCH', body }),

  delete: <T>(endpoint: string) =>
    apiServer<T>(endpoint, { method: 'DELETE' }),
};

// Server-side services factory
export function createServerServices() {
  return {
    clients: createClientService(serverApi),
    suppliers: createSupplierService(serverApi),
    carriers: createCarrierService(serverApi),
    entries: createEntryService(serverApi),
    loadOrders: createLoadOrderService(serverApi),
  };
}
