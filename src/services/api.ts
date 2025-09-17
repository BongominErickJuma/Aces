import axios from "axios";
import type { LoginCredentials, LoginResponse, User, TokenResponse } from "../types/auth";

// API base configuration
const API_BASE_URL = "https://aces-mover-server.onrender.com/api";

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
    console.log(`[API] Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    console.log(`[API] Full URL:`, config.baseURL + config.url);
    console.log(`[API] Request config:`, config);

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log(`[API] Added Bearer token to request`);
    } else {
      console.log(`[API] No access token available`);
    }
    return config;
  },
  (error) => {
    console.error(`[API] Request interceptor error:`, error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response received:`, response.status, response.statusText);
    console.log(`[API] Response data:`, response.data);
    return response;
  },
  async (error) => {
    console.error(`[API] Response error:`, error);
    console.error(`[API] Error status:`, error.response?.status);
    console.error(`[API] Error data:`, error.response?.data);
    console.error(`[API] Error message:`, error.message);

    const originalRequest = error.config;

    const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");
    const isProfileRequest = originalRequest.url?.includes("/auth/profile");
    const shouldSkipRefresh = originalRequest._retry || isRefreshRequest || (isProfileRequest && !accessToken);

    if (error.response?.status === 401 && !shouldSkipRefresh) {
      console.log(`[API] 401 error, attempting token refresh`);
      originalRequest._retry = true;

      try {
        // Try to refresh token
        await authAPI.refreshToken();
        console.log(`[API] Token refresh successful, retrying original request`);
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error(`[API] Token refresh failed:`, refreshError);
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
  saveSignature: async (data: { type: "canvas" | "upload"; data: string }) => {
    const response = await api.post("/signatures/save", data);
    return response.data;
  },

  uploadSignature: async (file: File) => {
    const formData = new FormData();
    formData.append("signature", file);

    const response = await api.post("/signatures/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getSignature: async () => {
    const response = await api.get("/signatures/me");
    return response.data;
  },

  deleteSignature: async () => {
    const response = await api.delete("/signatures/me");
    return response.data;
  },
};

// Authentication API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      console.log(`[AUTH] Starting login attempt with:`, { ...credentials, password: "[HIDDEN]" });
      const response = await api.post("/auth/login", credentials);
      console.log(`[AUTH] Login response received:`, response);

      const result = response.data as LoginResponse;
      console.log(`[AUTH] Login result:`, result);

      // Store the access token
      if (result.success && result.data?.tokens?.accessToken) {
        console.log(`[AUTH] Login successful, storing access token`);
        tokenManager.setAccessToken(result.data.tokens.accessToken);
      } else {
        console.log(`[AUTH] Login response did not contain expected token structure`);
      }

      return result;
    } catch (error: unknown) {
      console.error(`[AUTH] Login error:`, error);
      const axiosError = error as { response?: { data?: { message?: string; error?: { message?: string } } } };

      throw new Error(
        axiosError.response?.data?.message || axiosError.response?.data?.error?.message || "Login failed"
      );
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
