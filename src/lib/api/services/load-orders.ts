import type { LoadOrder } from '@/lib/types';
import type { ApiResponse, PaginatedResponse } from '../client';

export interface LoadOrderFilters {
  client_id?: string;
  carrier_id?: string;
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export function createLoadOrderService(api: {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) => Promise<ApiResponse<T>>;
  post: <T>(endpoint: string, body?: unknown) => Promise<ApiResponse<T>>;
  put: <T>(endpoint: string, body?: unknown) => Promise<ApiResponse<T>>;
  patch: <T>(endpoint: string, body?: unknown) => Promise<ApiResponse<T>>;
  delete: <T>(endpoint: string) => Promise<ApiResponse<T>>;
}) {
  return {
    /**
     * Get all load orders with optional filters and pagination
     */
    getAll: async (filters?: LoadOrderFilters) => {
      return api.get<PaginatedResponse<LoadOrder>>('/load-orders', filters as Record<string, string | number | boolean | undefined>);
    },

    /**
     * Get a load order by ID
     */
    getById: async (id: string) => {
      return api.get<LoadOrder>(`/load-orders/${id}`);
    },

    /**
     * Create a new load order
     */
    create: async (data: Omit<LoadOrder, 'id' | 'created_at' | 'updated_at' | 'clients' | 'carriers'>) => {
      return api.post<LoadOrder>('/load-orders', data);
    },

    /**
     * Update a load order
     */
    update: async (id: string, data: Partial<LoadOrder>) => {
      return api.put<LoadOrder>(`/load-orders/${id}`, data);
    },

    /**
     * Update load order status
     */
    updateStatus: async (id: string, status: 'open' | 'in_progress' | 'completed' | 'cancelled') => {
      return api.patch<{ message: string }>(`/load-orders/${id}/status`, { status });
    },

    /**
     * Delete a load order
     */
    delete: async (id: string) => {
      return api.delete<{ message: string }>(`/load-orders/${id}`);
    },
  };
}

export type LoadOrderService = ReturnType<typeof createLoadOrderService>;
