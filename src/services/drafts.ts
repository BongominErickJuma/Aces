import { api } from "./api";
import type { ApiResponse } from "../types/api";

// Draft types
export type DraftType = "quotation-create" | "receipt-create";

export interface Draft {
  _id: string;
  userId: string;
  type: DraftType;
  title: string;
  data: Record<string, any>;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftListItem {
  _id: string;
  type: DraftType;
  title: string;
  lastModified: string;
  createdAt: string;
}

export interface SaveDraftData {
  type: DraftType;
  data: Record<string, any>;
}

// Drafts API
export const draftsAPI = {
  // Get all drafts for the authenticated user (list view)
  getUserDrafts: async (): Promise<ApiResponse<DraftListItem[]>> => {
    try {
      const response = await api.get("/drafts");
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to fetch drafts");
    }
  },

  // Get draft by type
  getDraftByType: async (type: DraftType): Promise<ApiResponse<Draft | null>> => {
    try {
      const response = await api.get(`/drafts/${type}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to fetch draft");
    }
  },

  // Save or update draft
  saveDraft: async (data: SaveDraftData): Promise<ApiResponse<Draft>> => {
    try {
      const response = await api.post("/drafts", data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to save draft");
    }
  },

  // Delete draft by type
  deleteDraftByType: async (type: DraftType): Promise<ApiResponse<{}>> => {
    try {
      const response = await api.delete(`/drafts/${type}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to delete draft");
    }
  },

  // Delete all user drafts
  deleteAllDrafts: async (): Promise<ApiResponse<{ deletedCount: number }>> => {
    try {
      const response = await api.delete("/drafts");
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to delete all drafts");
    }
  },
};

// Helper functions for draft management
export const draftHelpers = {
  // Check if a draft exists for a given type
  checkDraftExists: async (type: DraftType): Promise<boolean> => {
    try {
      const response = await draftsAPI.getDraftByType(type);
      return response.success && response.data !== null;
    } catch {
      return false;
    }
  },

  // Load draft data for a form
  loadDraftData: async (type: DraftType): Promise<Record<string, any> | null> => {
    try {
      const response = await draftsAPI.getDraftByType(type);
      if (response.success && response.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to load draft:", error);
      return null;
    }
  },

  // Save draft with automatic title generation
  saveDraftWithTitle: async (type: DraftType, data: Record<string, any>): Promise<boolean> => {
    try {
      await draftsAPI.saveDraft({ type, data });
      return true;
    } catch (error) {
      console.error("Failed to save draft:", error);
      return false;
    }
  },

  // Clear draft for a specific form type
  clearDraft: async (type: DraftType): Promise<boolean> => {
    try {
      await draftsAPI.deleteDraftByType(type);
      return true;
    } catch (error) {
      console.error("Failed to clear draft:", error);
      return false;
    }
  },
};