import type { Client } from '@/lib/types';
import type { ApiResponse, PaginatedResponse } from '../client';

// Client-side imports
export function createClientService(api: {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) => Promise<ApiResponse<T>>;
  post: <T>(endpoint: string, body?: unknown) => Promise<ApiResponse<T>>;
  put: <T>(endpoint: string, body?: unknown) => Promise<ApiResponse<T>>;
  delete: <T>(endpoint: string) => Promise<ApiResponse<T>>;
}) {
  return {
    /**
     * Get all clients
     */
    getAll: async (options?: { active?: boolean }) => {
      return api.get<Client[]>('/catalogs/clients', options);
    },

    /**
     * Get a client by ID
     */
    getById: async (id: string) => {
      return api.get<Client>(`/catalogs/clients/${id}`);
    },

    /**
     * Search clients by name
     */
    search: async (query: string) => {
      return api.get<Client[]>('/catalogs/clients/search', { q: query });
    },

    /**
     * Create a new client
     */
    create: async (data: Omit<Client, 'id' | 'created_at'>) => {
      return api.post<Client>('/catalogs/clients', data);
    },

    /**
     * Update a client
     */
    update: async (id: string, data: Partial<Client>) => {
      return api.put<Client>(`/catalogs/clients/${id}`, data);
    },

    /**
     * Delete a client
     */
    delete: async (id: string) => {
      return api.delete<{ message: string }>(`/catalogs/clients/${id}`);
    },
  };
}

// Export types
export type ClientService = ReturnType<typeof createClientService>;
