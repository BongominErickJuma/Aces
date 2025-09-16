import axios from "axios";
import type { LoginCredentials, LoginResponse, User, TokenResponse } from "../types/auth";

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for JWT cookie authentication
  headers: {
    "Content-Type": "application/json",
  },
});

// Token storage
let accessToken: string | null = null;

// Request interceptor - Add Authorization header
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh if:
    // 1. It's already a retry
    // 2. It's the refresh endpoint itself
    // 3. It's the profile endpoint during initial auth check
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');
    const isProfileRequest = originalRequest.url?.includes('/auth/profile');
    const shouldSkipRefresh = originalRequest._retry || isRefreshRequest || (isProfileRequest && !accessToken);

    if (error.response?.status === 401 && !shouldSkipRefresh) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        await authAPI.refreshToken();
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear token
        accessToken = null;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Token management functions
export const tokenManager = {
  setAccessToken: (token: string) => {
    accessToken = token;
  },

  getAccessToken: () => {
    return accessToken;
  },

  clearAccessToken: () => {
    accessToken = null;
  },
};

// Authentication API
// Signature API
export const signatureApi = {
  saveSignature: async (data: { type: 'canvas' | 'upload'; data: string }) => {
    const response = await api.post('/signatures/save', data);
    return response.data;
  },

  uploadSignature: async (file: File) => {
    const formData = new FormData();
    formData.append('signature', file);

    const response = await api.post('/signatures/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getSignature: async () => {
    const response = await api.get('/signatures/me');
    return response.data;
  },

  deleteSignature: async () => {
    const response = await api.delete('/signatures/me');
    return response.data;
  },
};

// Authentication API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post("/auth/login", credentials);
      const result = response.data as LoginResponse;

      // Store the access token
      if (result.success && result.data?.tokens?.accessToken) {
        tokenManager.setAccessToken(result.data.tokens.accessToken);
      }

      return result;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string; error?: { message?: string } } } };
      throw new Error(axiosError.response?.data?.message || axiosError.response?.data?.error?.message || "Login failed");
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      console.error("Logout error:", axiosError.response?.data?.message || "Logout failed");
    } finally {
      // Clear token regardless of API call success
      tokenManager.clearAccessToken();
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get("/auth/profile");
      return response.data.data.user;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to get user info");
    }
  },

  refreshToken: async (): Promise<TokenResponse> => {
    try {
      const response = await api.post("/auth/refresh");
      const result = response.data as TokenResponse;

      // Update stored access token
      if (result.success && result.data?.accessToken) {
        tokenManager.setAccessToken(result.data.accessToken);
      }

      return result;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Token refresh failed");
    }
  },
};
