import type { Entry, EntryPackageCode } from '@/lib/types';
import type { ApiResponse, PaginatedResponse } from '../client';

export interface EntryFilters {
  client_id?: string;
  supplier_id?: string;
  carrier_id?: string;
  status?: 'pending' | 'received';
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export function createEntryService(api: {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) => Promise<ApiResponse<T>>;
  post: <T>(endpoint: string, body?: unknown) => Promise<ApiResponse<T>>;
  put: <T>(endpoint: string, body?: unknown) => Promise<ApiResponse<T>>;
  patch: <T>(endpoint: string, body?: unknown) => Promise<ApiResponse<T>>;
  delete: <T>(endpoint: string) => Promise<ApiResponse<T>>;
}) {
  return {
    /**
     * Get all entries with optional filters and pagination
     */
    getAll: async (filters?: EntryFilters) => {
      return api.get<PaginatedResponse<Entry>>('/entries', filters as Record<string, string | number | boolean | undefined>);
    },

    /**
     * Get an entry by ID
     */
    getById: async (id: string) => {
      return api.get<Entry>(`/entries/${id}`);
    },

    /**
     * Create a new entry
     */
    create: async (data: Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'clients' | 'suppliers' | 'carriers'>) => {
      return api.post<Entry>('/entries', data);
    },

    /**
     * Update an entry
     */
    update: async (id: string, data: Partial<Entry>) => {
      return api.put<Entry>(`/entries/${id}`, data);
    },

    /**
     * Update entry status
     */
    updateStatus: async (id: string, status: 'pending' | 'received') => {
      return api.patch<{ message: string }>(`/entries/${id}/status`, { status });
    },

    /**
     * Delete an entry
     */
    delete: async (id: string) => {
      return api.delete<{ message: string }>(`/entries/${id}`);
    },

    /**
     * Get package codes for an entry (for labels / barcode)
     */
    getPackageCodes: async (id: string) => {
      return api.get<EntryPackageCode[]>(`/entries/${id}/package-codes`);
    },

    /**
     * Generate package codes for a received entry (idempotent)
     */
    generatePackageCodes: async (id: string) => {
      return api.post<{ codes?: EntryPackageCode[]; count: number }>(`/entries/${id}/package-codes/generate`);
    },
  };
}

export type EntryService = ReturnType<typeof createEntryService>;
