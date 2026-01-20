import type { Supplier } from '@/lib/types';
import type { ApiResponse } from '../client';

export function createSupplierService(api: {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) => Promise<ApiResponse<T>>;
  post: <T>(endpoint: string, body?: unknown) => Promise<ApiResponse<T>>;
  put: <T>(endpoint: string, body?: unknown) => Promise<ApiResponse<T>>;
  delete: <T>(endpoint: string) => Promise<ApiResponse<T>>;
}) {
  return {
    /**
     * Get all suppliers
     */
    getAll: async () => {
      return api.get<Supplier[]>('/catalogs/suppliers');
    },

    /**
     * Get a supplier by ID
     */
    getById: async (id: string) => {
      return api.get<Supplier>(`/catalogs/suppliers/${id}`);
    },

    /**
     * Search suppliers by name
     */
    search: async (query: string) => {
      return api.get<Supplier[]>('/catalogs/suppliers/search', { q: query });
    },

    /**
     * Create a new supplier
     */
    create: async (data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
      return api.post<Supplier>('/catalogs/suppliers', data);
    },

    /**
     * Update a supplier
     */
    update: async (id: string, data: Partial<Supplier>) => {
      return api.put<Supplier>(`/catalogs/suppliers/${id}`, data);
    },

    /**
     * Delete a supplier
     */
    delete: async (id: string) => {
      return api.delete<{ message: string }>(`/catalogs/suppliers/${id}`);
    },
  };
}

export type SupplierService = ReturnType<typeof createSupplierService>;
