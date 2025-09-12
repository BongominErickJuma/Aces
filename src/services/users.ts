import { api } from "./api";
import type { User } from "../types/auth";

export interface CreateUserData {
  fullName: string;
  email: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  role: "admin" | "user";
  sendWelcomeEmail: boolean;
  requirePasswordChange: boolean;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    temporaryPassword: string;
  };
}

export const usersAPI = {
  createUser: async (userData: CreateUserData): Promise<CreateUserResponse> => {
    try {
      const response = await api.post("/users", userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create user");
    }
  },

  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) => {
    try {
      const response = await api.get("/users", { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch users");
    }
  },

  getUserById: async (id: string): Promise<User> => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch user");
    }
  },

  updateUser: async (id: string, updates: Partial<User>) => {
    try {
      const response = await api.put(`/users/${id}`, updates);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update user");
    }
  },

  deleteUser: async (id: string) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete user");
    }
  },

  resetPassword: async (id: string) => {
    try {
      const response = await api.post(`/users/${id}/reset-password`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to reset password");
    }
  },
};