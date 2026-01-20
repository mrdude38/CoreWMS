import type { Carrier } from '@/lib/types';
import type { ApiResponse } from '../client';

export function createCarrierService(api: {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) => Promise<ApiResponse<T>>;
  post: <T>(endpoint: string, body?: unknown) => Promise<ApiResponse<T>>;
  put: <T>(endpoint: string, body?: unknown) => Promise<ApiResponse<T>>;
  delete: <T>(endpoint: string) => Promise<ApiResponse<T>>;
}) {
  return {
    /**
     * Get all carriers
     */
    getAll: async () => {
      return api.get<Carrier[]>('/catalogs/carriers');
    },

    /**
     * Get a carrier by ID
     */
    getById: async (id: string) => {
      return api.get<Carrier>(`/catalogs/carriers/${id}`);
    },

    /**
     * Search carriers by name
     */
    search: async (query: string) => {
      return api.get<Carrier[]>('/catalogs/carriers/search', { q: query });
    },

    /**
     * Create a new carrier
     */
    create: async (data: Omit<Carrier, 'id' | 'created_at' | 'updated_at'>) => {
      return api.post<Carrier>('/catalogs/carriers', data);
    },

    /**
     * Update a carrier
     */
    update: async (id: string, data: Partial<Carrier>) => {
      return api.put<Carrier>(`/catalogs/carriers/${id}`, data);
    },

    /**
     * Delete a carrier
     */
    delete: async (id: string) => {
      return api.delete<{ message: string }>(`/catalogs/carriers/${id}`);
    },
  };
}

export type CarrierService = ReturnType<typeof createCarrierService>;
