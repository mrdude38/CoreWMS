"use client";

import { api } from '../client';
import type { UserProfile } from '@/lib/types';

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email: string;
  };
  profile?: {
    id: string;
    full_name: string;
    role: string;
    client_id?: string;
    is_active: boolean;
  };
}

export interface CurrentUserResponse {
  user: {
    id: string;
    email: string;
  };
  profile: UserProfile;
}

export const authApi = {
  /**
   * Sign in with email and password
   */
  signIn: async (credentials: SignInRequest) => {
    return api.post<AuthResponse>('/auth/signin', credentials);
  },

  /**
   * Sign up a new user
   */
  signUp: async (data: SignUpRequest) => {
    return api.post<AuthResponse>('/auth/signup', data);
  },

  /**
   * Refresh the access token
   */
  refreshToken: async (refreshToken: string) => {
    return api.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken });
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    return api.post<{ message: string }>('/auth/signout');
  },

  /**
   * Request password reset
   */
  resetPassword: async (email: string, redirectTo?: string) => {
    return api.post<{ message: string }>('/auth/reset-password', { email, redirect_to: redirectTo });
  },

  /**
   * Get the current authenticated user
   */
  getCurrentUser: async () => {
    return api.get<CurrentUserResponse>('/me');
  },
};
