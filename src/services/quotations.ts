import { api } from "./api";
import type { ApiResponse, PaginatedResponse } from "../types/api";

// Quotation types
export interface QuotationClient {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  gender?: string;
}

export interface QuotationLocations {
  from: string;
  to: string;
  movingDate: string;
}

export interface QuotationService {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuotationPricing {
  currency: "UGX" | "USD";
  subtotal: number;
  discount?: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface QuotationValidity {
  validUntil: string;
  daysValid: number;
  status: "active" | "expired" | "converted";
}

export interface Quotation {
  _id: string;
  quotationNumber: string;
  type: "Residential" | "International" | "Office";
  client: QuotationClient;
  locations: QuotationLocations;
  services: QuotationService[];
  pricing: QuotationPricing;
  validity: QuotationValidity;
  termsAndConditions?: string;
  notes?: string;
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  pdfUrl?: string;
  version: number;
  convertedToReceipt?: {
    receiptId: string;
    convertedAt: string;
    convertedBy: {
      _id: string;
      fullName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  isExpired: boolean;
  remainingDays: number;
}

export interface CreateQuotationData {
  type: "Residential" | "International" | "Office";
  client: QuotationClient;
  locations: QuotationLocations;
  services: Omit<QuotationService, "total">[];
  pricing: Omit<QuotationPricing, "subtotal" | "taxAmount" | "totalAmount">;
  termsAndConditions?: string;
  notes?: string;
}

export interface UpdateQuotationData {
  type?: "Residential" | "International" | "Office";
  client?: QuotationClient;
  locations?: QuotationLocations;
  services?: Omit<QuotationService, "total">[];
  pricing?: QuotationPricing; // Full pricing object including subtotal, taxAmount, totalAmount
  termsAndConditions?: string;
  notes?: string;
}

export interface QuotationFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
  createdBy?: string;
}

export interface ExtendValidityData {
  days: number;
  reason: string;
}

export interface SendQuotationData {
  recipientEmail: string;
  message?: string;
}

export interface BulkOperationData {
  ids: string[];
}

// Quotations API
export const quotationsAPI = {
  // Get all quotations with filters
  getQuotations: async (filters?: QuotationFilters): Promise<PaginatedResponse<Quotation[]>> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`/quotations?${params.toString()}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to fetch quotations");
    }
  },

  // Get single quotation by ID
  getQuotationById: async (id: string): Promise<ApiResponse<{ quotation: Quotation }>> => {
    try {
      const response = await api.get(`/quotations/${id}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to fetch quotation");
    }
  },

  // Create new quotation
  createQuotation: async (data: CreateQuotationData): Promise<ApiResponse<{ quotation: Quotation }>> => {
    try {
      const response = await api.post("/quotations", data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string; error?: { details?: { field?: string; reason?: string } } } };
      };
      throw new Error(
        axiosError.response?.data?.error?.details?.reason ||
          axiosError.response?.data?.message ||
          "Failed to create quotation"
      );
    }
  },

  // Update quotation
  updateQuotation: async (id: string, data: UpdateQuotationData): Promise<ApiResponse<{ quotation: Quotation }>> => {
    try {
      const response = await api.put(`/quotations/${id}`, data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to update quotation");
    }
  },

  // Delete quotation (Admin only)
  deleteQuotation: async (id: string): Promise<ApiResponse<{ quotationNumber: string }>> => {
    try {
      const response = await api.delete(`/quotations/${id}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to delete quotation");
    }
  },

  // Extend quotation validity
  extendValidity: async (
    id: string,
    data: ExtendValidityData
  ): Promise<ApiResponse<{ quotationNumber: string; newValidUntil: string; remainingDays: number }>> => {
    try {
      const response = await api.put(`/quotations/${id}/extend`, data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to extend quotation validity");
    }
  },

  // Get quotation statistics
  getQuotationStats: async (
    period?: "week" | "month" | "year"
  ): Promise<ApiResponse<{ stats: Record<string, unknown> }>> => {
    try {
      const params = period ? `?period=${period}` : "";
      const response = await api.get(`/quotations/stats${params}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to fetch quotation statistics");
    }
  },

  // Generate quotation PDF
  generatePDF: async (
    id: string
  ): Promise<ApiResponse<{ pdfUrl: string; fileName: string; quotationNumber: string }>> => {
    try {
      const response = await api.get(`/quotations/${id}/pdf`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to generate PDF");
    }
  },

  // Download quotation PDF
  downloadPDF: async (id: string): Promise<Blob> => {
    try {
      const response = await api.get(`/quotations/${id}/download`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to download PDF");
    }
  },

  // Send quotation PDF via email
  sendPDF: async (
    id: string,
    data: SendQuotationData
  ): Promise<ApiResponse<{ quotationNumber: string; sentTo: string }>> => {
    try {
      const response = await api.post(`/quotations/${id}/send`, data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to send quotation PDF");
    }
  },

  // Bulk operations
  bulkDelete: async (ids: string[]): Promise<ApiResponse<{ deletedCount: number; requestedCount: number }>> => {
    try {
      const response = await api.post("/quotations/bulk/delete", { quotationIds: ids });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to delete quotations");
    }
  },

  bulkDownload: async (
    ids: string[]
  ): Promise<
    ApiResponse<{ quotations: Array<{ id: string; quotationNumber: string; downloadUrl: string }>; count: number }>
  > => {
    try {
      const response = await api.post("/quotations/bulk/download", { quotationIds: ids });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to prepare bulk download");
    }
  },
};
